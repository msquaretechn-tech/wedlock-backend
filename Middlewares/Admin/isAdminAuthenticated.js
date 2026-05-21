import jwt from 'jsonwebtoken';


import { redis } from '../../Utils/redis.js';
import { catchAsyncError } from '../catchAsyncError.js';
import errorhandler from '../../Utils/errorhandler.js';


export const isAdminAuthenticated = catchAsyncError(async (req, res, next) => {
  const authHeader = req.header('Authorization');


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new errorhandler('Authorization token missing or invalid', 401));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESSTOKEN);
  } catch {
    return next(new errorhandler('Invalid or expired token', 403));
  }

  const adminData = await redis.get(`admin:${decoded.adminId}`);
  if (!adminData) {
    return next(new errorhandler('Admin session not found', 403));
  }

  req.admin = JSON.parse(adminData);
  next();
});
