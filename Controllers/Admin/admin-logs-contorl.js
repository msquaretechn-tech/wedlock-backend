

import AdminApiLog from '../../Models/Admin/admin.logs.js';
import { catchAsyncError } from '../../Middlewares/catchAsyncError.js';
// Get all logs
export const getAdminLogs = catchAsyncError(async (req, res) => {
  const logs = await AdminApiLog.findAll({
    order: [['timestamp', 'DESC']],
    limit: 100,
  });

  res.status(200).json({
    success: true,
    logs,
  });
});

// Get logs for a specific admin
export const getLogsByAdminId = catchAsyncError(async (req, res) => {
  const { adminId } = req.params;

  const logs = await AdminApiLog.findAll({
    where: { admin_id: adminId },
    order: [['timestamp', 'DESC']],
    limit: 100,
  });

  res.status(200).json({
    success: true,
    logs,
  });
});
