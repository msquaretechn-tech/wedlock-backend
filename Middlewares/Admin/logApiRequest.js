import AdminApiLog from "../../Models/Admin/admin.logs.js";

export const logApiRequest = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const { method, originalUrl, headers } = req;
    const duration = Date.now() - startTime;
    const admin = req.admin || {};

    try {
      await AdminApiLog.create({
        admin_id: admin.adminId || null,
        email: admin.email || null,
        role: admin.role || null,
        method,
        endpoint: originalUrl,
        ip_address: req.headers['x-forwarded-for'] || req.ip,
        user_agent: headers['user-agent'] || null,
        status_code: res.statusCode,
        response_time_ms: duration
      });
    } catch (err) {
      console.error("Failed to log admin API request:", err.message);
    }
  });

  next();
};
