import crypto from 'crypto';

/**
 * Generate official ZEGOCLOUD Token04 for Zego Express Web & Zego ZIM (Signaling / Call Invitation)
 * 
 * @param {number} appId - Zego App ID (e.g. 1202014598)
 * @param {string} serverSecret - Zego Server Secret from Zego Console (e.g. 9b9f494909d87f7d123a84c20d7b0d37)
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
    
    // Generate random int64 nonce
    const nonce = Math.floor(Math.random() * 9000000000000000) + 1000000000000000;
    const strPayload = payload || '';

    // Official Zego Token04 signature plaintext string:
    // appId + userId + nonce + ctime + expire + payload
    const signText = `${numericAppId}${strUserId}${nonce}${ctime}${expire}${strPayload}`;

    // HMAC-SHA256 signature using serverSecret
    const hmac = crypto.createHmac('sha256', serverSecret);
    hmac.update(signText);
    const signature = hmac.digest('hex');

    const tokenInfo = {
        app_id: numericAppId,
        user_id: strUserId,
        nonce: nonce,
        ctime: ctime,
        expire: expire,
        payload: strPayload,
        token: signature
    };

    // Return version "04" + Base64 encoded JSON string
    return '04' + Buffer.from(JSON.stringify(tokenInfo)).toString('base64');
}
