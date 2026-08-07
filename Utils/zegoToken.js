import crypto from 'crypto';

/**
 * Generate Zego Token04 / KitToken for ZEGOCLOUD Audio/Video Calling & Signaling
 * 
 * @param {number} appId - Zego App ID (e.g. 1202014598)
 * @param {string} serverSecret - 32 character Zego Server Secret from Zego Console
 * @param {string} userId - Unique User ID string (e.g. Database userId)
 * @param {number} [effectiveTimeInSeconds=3600] - Token validity in seconds (default 1 hour)
 * @param {string} [payload=""] - Optional custom payload JSON string
 * @returns {string} Zego KitToken string compatible with ZegoUIKitPrebuilt.create(kitToken)
 */
export function generateZegoToken(appId, serverSecret, userId, effectiveTimeInSeconds = 3600, payload = '') {
    if (!appId || !serverSecret || !userId) {
        throw new Error('appId, serverSecret, and userId are required to generate Zego Token');
    }

    const ctime = Math.floor(Date.now() / 1000);
    const expire = ctime + effectiveTimeInSeconds;
    const nonce = Math.floor(Math.random() * 2147483647);

    // Create payload object
    const tokenInfo = {
        app_id: Number(appId),
        user_id: String(userId),
        nonce: nonce,
        ctime: ctime,
        expire: expire,
        payload: payload || ''
    };

    // Calculate signature using HMAC-SHA256
    const plainText = JSON.stringify(tokenInfo);
    const hmac = crypto.createHmac('sha256', serverSecret);
    hmac.update(plainText);
    const signature = hmac.digest('hex');

    // Attach signature
    tokenInfo.token = signature;

    // Return version "04" + Base64 encoded token payload
    const finalToken = '04' + Buffer.from(JSON.stringify(tokenInfo)).toString('base64');
    return finalToken;
}
