import twilio from 'twilio';
import dotenv from 'dotenv';
import { redis } from './redis.js';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if credentials are demo/placeholder
const isDemoMode = () => {
    return (
        !accountSid ||
        !authToken ||
        accountSid.includes('ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') ||
        authToken.includes('your_twilio_auth_token_here')
    );
};

let client = null;
const getClient = () => {
    if (!client && !isDemoMode()) {
        client = twilio(accountSid, authToken);
    }
    return client;
};

/**
 * Format phone number to E.164 standard.
 * Default country code is +91 (India) if not provided.
 */
export const formatPhoneNumber = (phone, defaultCountryCode = '+91') => {
    if (!phone) return '';
    let cleaned = phone.toString().trim().replace(/[\s-]/g, '');

    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // If starts with 00, replace with +
    if (cleaned.startsWith('00')) {
        return '+' + cleaned.slice(2);
    }

    // Numbers saved before country codes were collected: Australian numbers are stored
    // in local format with the trunk 0 (e.g. 0478648984 -> +61478648984)
    if (/^0\d{9}$/.test(cleaned)) {
        return `+61${cleaned.slice(1)}`;
    }

    // If 10 digits, prepend default country code
    if (cleaned.length === 10) {
        return `${defaultCountryCode}${cleaned}`;
    }

    // If already has country code digits without plus (e.g. 919876543210)
    return `+${cleaned}`;
};

/**
 * Send OTP to phone number using Twilio Verify or Twilio SMS
 */
export const sendOtpToPhone = async (phone, defaultCountryCode = '+91') => {
    const formattedPhone = formatPhoneNumber(phone, defaultCountryCode);

    // If credentials are demo/dummy, simulate OTP generation
    if (isDemoMode()) {
        const demoOtp = '123456';
        console.warn(`[TWILIO DEMO MODE] Credentials are not configured. Using Demo OTP: ${demoOtp} for ${formattedPhone}`);
        try {
            await redis.set(`otp:${formattedPhone}`, demoOtp, 'EX', 300);
        } catch (err) {
            console.error('Redis error while storing demo OTP:', err.message);
        }
        return {
            success: true,
            isDemo: true,
            formattedPhone,
            message: 'Demo OTP sent (Use 123456). Update real Twilio credentials in .env.'
        };
    }

    const twilioClient = getClient();

    // 1. Preferred: Twilio Verify Service API
    if (verifyServiceSid && !verifyServiceSid.includes('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')) {
        const verification = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verifications.create({ to: formattedPhone, channel: 'sms' });

        return {
            success: true,
            status: verification.status,
            formattedPhone,
            message: 'OTP sent successfully via Twilio Verify'
        };
    }

    // 2. Fallback: Standard Twilio SMS API with Redis OTP storage
    if (twilioPhoneNumber) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Redis for 5 minutes (300 seconds)
        await redis.set(`otp:${formattedPhone}`, otp, 'EX', 300);

        await twilioClient.messages.create({
            body: `Your Wedlock login verification code is: ${otp}. It will expire in 5 minutes.`,
            from: twilioPhoneNumber,
            to: formattedPhone
        });

        return {
            success: true,
            status: 'pending',
            formattedPhone,
            message: 'OTP sent successfully via Twilio SMS'
        };
    }

    throw new Error('Twilio configuration incomplete. Please provide TWILIO_VERIFY_SERVICE_SID or TWILIO_PHONE_NUMBER in .env.');
};

/**
 * Verify OTP for phone number
 */
export const verifyPhoneOtp = async (phone, otpCode, defaultCountryCode = '+91') => {
    const formattedPhone = formatPhoneNumber(phone, defaultCountryCode);
    const cleanOtp = (otpCode || '').toString().trim();

    if (!cleanOtp) {
        return false;
    }

    // If demo mode or test fallback
    if (isDemoMode()) {
        let storedOtp = null;
        try {
            storedOtp = await redis.get(`otp:${formattedPhone}`);
        } catch (err) {
            console.error('Redis get error:', err.message);
        }

        if (cleanOtp === '123456' || (storedOtp && storedOtp === cleanOtp)) {
            try {
                await redis.del(`otp:${formattedPhone}`);
            } catch (_) {}
            return true;
        }
        return false;
    }

    const twilioClient = getClient();

    // 1. Verify via Twilio Verify Service
    if (verifyServiceSid && !verifyServiceSid.includes('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')) {
        try {
            const verificationCheck = await twilioClient.verify.v2
                .services(verifyServiceSid)
                .verificationChecks.create({ to: formattedPhone, code: cleanOtp });

            return verificationCheck.status === 'approved';
        } catch (error) {
            console.error('Twilio Verify error:', error.message);
            return false;
        }
    }

    // 2. Verify via Redis for standard SMS API
    try {
        const storedOtp = await redis.get(`otp:${formattedPhone}`);
        if (storedOtp && storedOtp === cleanOtp) {
            await redis.del(`otp:${formattedPhone}`);
            return true;
        }
    } catch (err) {
        console.error('Redis verification error:', err.message);
    }

    return false;
};
