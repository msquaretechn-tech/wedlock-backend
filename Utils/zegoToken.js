import crypto from 'crypto';

/**
 * Generate official ZEGOCLOUD Token04 for Zego Express Web & Zego ZIM (Signaling / Call Invitation)
 * 
 * @param {number} appId - Zego App ID (e.g. 1202014598)
 * @param {string} serverSecret - Zego Server Secret from Zego Console (32 bytes)
 * @param {string} userId - Unique User ID string (e.g. Database userId)
 * @param {number} [effectiveTimeInSeconds=3600] - Token validity in seconds (default 3600s)
 * @param {string} [payload=""] - Optional custom payload string (default empty string)
 * @returns {string} Zego Token04 string starting with "04"
 */
export function generateZegoToken(appId, serverSecret, userId, effectiveTimeInSeconds = 3600, payload = '') {
    if (!appId || !serverSecret || !userId) {
        throw new Error('appId, serverSecret, and userId are required to generate Zego Token');
    }

    const numericAppId = Number(appId);
    const strUserId = String(userId);
    const ctime = Math.floor(Date.now() / 1000);
    const expire = ctime + effectiveTimeInSeconds;
    
    // Generate random int32 nonce
    const nonceInt = Math.floor(Math.random() * 2147483647);
    const strPayload = payload || '';

    const tokenInfo = {
        app_id: numericAppId,
        user_id: strUserId,
        nonce: nonceInt,
        ctime: ctime,
        expire: expire,
        payload: strPayload
    };

    const plainText = JSON.stringify(tokenInfo);

    // Prepare 32-byte AES key
    let keyBuffer = Buffer.from(serverSecret, 'utf8');
    if (keyBuffer.length !== 32) {
        if (serverSecret.length === 32) {
            keyBuffer = Buffer.from(serverSecret, 'utf8');
        } else {
            keyBuffer = crypto.createHash('sha256').update(serverSecret).digest();
        }
    }

    // 12-byte random IV for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    const encrypted = cipher.update(plainText, 'utf8');
    const final = cipher.final();
    const tag = cipher.getAuthTag();

    // Encrypted payload + auth tag
    const encryptBuf = Buffer.concat([encrypted, final, tag]);

    // Binary packing format for Zego Token04:
    // 1. Expire timestamp (8 bytes, BigEndian uint64)
    const b1 = Buffer.alloc(8);
    b1.writeBigInt64BE(BigInt(expire), 0);

    // 2. IV Length (2 bytes, BigEndian uint16)
    const b2 = Buffer.alloc(2);
    b2.writeUInt16BE(iv.length, 0);

    // 3. Encrypted Buffer Length (2 bytes, BigEndian uint16)
    const b3 = Buffer.alloc(2);
    b3.writeUInt16BE(encryptBuf.length, 0);

    // Combine binary components: b1 + b2 + iv + b3 + encryptBuf
    const binaryToken = Buffer.concat([b1, b2, iv, b3, encryptBuf]);

    // Return version "04" + Base64 encoded binary string
    return '04' + binaryToken.toString('base64');
}

