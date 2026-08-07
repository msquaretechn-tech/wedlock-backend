import crypto from 'crypto';

/**
 * Generate official ZEGOCLOUD Token04 for Zego Express & Zego ZIM (Signaling / Call Invitation)
 * 
 * @param {number} appId - Zego App ID (e.g. 1202014598)
 * @param {string} serverSecret - Zego Server Secret from Zego Console (32-char string or 64-char hex string)
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

    // Generate random 8-byte nonce
    const nonce = crypto.randomBytes(8);

    // Buffers for userId and payload
    const userIdBuffer = Buffer.from(strUserId, 'utf8');
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || '');
    const payloadBuffer = Buffer.from(payloadStr, 'utf8');

    // Create binary content buffer:
    // 8 bytes (expire) + 8 bytes (nonce) + 2 bytes (userId length) + userId bytes + 2 bytes (payload length) + payload bytes
    const contentLen = 8 + 8 + 2 + userIdBuffer.length + 2 + payloadBuffer.length;
    const contentBuffer = Buffer.alloc(contentLen);

    let offset = 0;
    // 1. Expire time (uint64 BigEndian)
    contentBuffer.writeBigInt64BE(BigInt(expire), offset);
    offset += 8;

    // 2. Nonce (8 bytes)
    nonce.copy(contentBuffer, offset);
    offset += 8;

    // 3. User ID length (uint16 BigEndian)
    contentBuffer.writeUInt16BE(userIdBuffer.length, offset);
    offset += 2;

    // 4. User ID bytes
    userIdBuffer.copy(contentBuffer, offset);
    offset += userIdBuffer.length;

    // 5. Payload length (uint16 BigEndian)
    contentBuffer.writeUInt16BE(payloadBuffer.length, offset);
    offset += 2;

    // 6. Payload bytes
    if (payloadBuffer.length > 0) {
        payloadBuffer.copy(contentBuffer, offset);
        offset += payloadBuffer.length;
    }

    // Secret buffer handling (if 64-character hex string from Zego console, convert hex to binary 32-bytes)
    let secretBuffer;
    if (serverSecret.length === 64 && /^[0-9a-fA-F]+$/.test(serverSecret)) {
        secretBuffer = Buffer.from(serverSecret, 'hex');
    } else {
        secretBuffer = Buffer.from(serverSecret, 'utf8');
    }

    // Signature calculation over [appId (4 bytes uint32 BE) + contentBuffer]
    const signBuffer = Buffer.alloc(4 + contentBuffer.length);
    signBuffer.writeUInt32BE(numericAppId, 0);
    contentBuffer.copy(signBuffer, 4);

    const hmac = crypto.createHmac('sha256', secretBuffer);
    hmac.update(signBuffer);
    const signature = hmac.digest(); // 32-byte binary Buffer

    // Final binary token buffer = contentBuffer + 2 bytes signature length (32) + signature (32 bytes)
    const tokenBuffer = Buffer.alloc(contentBuffer.length + 2 + signature.length);
    contentBuffer.copy(tokenBuffer, 0);
    tokenBuffer.writeUInt16BE(signature.length, contentBuffer.length);
    signature.copy(tokenBuffer, contentBuffer.length + 2);

    // Return version "04" + Base64 encoded token buffer
    return '04' + tokenBuffer.toString('base64');
}
