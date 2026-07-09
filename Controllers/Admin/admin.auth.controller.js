import Admin from "../../Models/Admin/admin.modal.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import errorhandler from "../../Utils/errorhandler.js";
import { catchAsyncError } from "../../Middlewares/catchAsyncError.js";
import sendEmail from "../../Utils/sendMail.js";
import sendAdminInfoEmail from "../../Utils/adminSendMail.js";
import { redis } from "../../Utils/redis.js";
import { accessTokenOptions, refreshTokenOptions } from "../../Utils/jwt.js";


export const registerAdmin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new errorhandler("Email and Password are required", 400));
  }

  const existingAdmin = await Admin.findOne({ where: { email } });
  if (existingAdmin) {
    return next(new errorhandler("Admin already exists", 400));
  }

  const admin = await Admin.create({ email, password });

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully',
    admin: {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      status: admin.status
    }
  });
});


export const adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new errorhandler("Email and Password are required", 400));
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return next(new errorhandler("Invalid credentials", 401));
  }

  const isPasswordValid = await admin.validPassword(password);
  if (!isPasswordValid) {
    return next(new errorhandler("Invalid credentials", 401));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email}`, otp, 'EX', 300); // 🔧 CORRECT SYNTAX

  try {
    await sendAdminInfoEmail({
      email,
      subject: "Your Login OTP",
      template: "admin-login.ejs",
      data: {
        activationCode: otp,
        email
      }
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      email
    });

  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});

// ✅ Verify OTP and Issue Tokens
export const verifyLoginOtp = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new errorhandler("Email and OTP are required", 400));
  }

  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp.toString()) {
    return next(new errorhandler("Invalid or expired OTP", 401));
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return next(new errorhandler("Admin not found", 404));
  }

  const accessToken = jwt.sign(
    { adminId: admin.adminId, email: admin.email, role: admin.role },
    process.env.ACCESSTOKEN,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { adminId: admin.adminId },
    process.env.REFRESHTOKEN,
    { expiresIn: '7d' }
  );

  await redis.set(
    `admin:${admin.adminId}`,
    JSON.stringify({
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    }),
    'EX', 60 * 60 * 24 * 7 // 7 days
  );

  await redis.del(`otp:${email}`);

  res.cookie('access_token', accessToken, accessTokenOptions);
  res.cookie('refresh_token', refreshToken, refreshTokenOptions);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    admin: {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  });
});

// ✅ Admin Logout
export const adminLogout = catchAsyncError(async (req, res, next) => {
  const { adminId } = req.admin;

  await redis.del(`admin:${adminId}`);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

// ✅ Update Access Token using Refresh Token
export const updateAdminAccessToken = catchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token ||
      req.headers["refresh_token"] ||
      req.headers.authorization?.split(" ")[1];

    if (!refresh_token) {
      return next(new errorhandler("Please login to access this resource", 400));
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESHTOKEN);
    const message = 'Could not refresh token';

    if (!decoded) {
      return next(new errorhandler(message, 401));
    }

    const session = await redis.get(`admin:${decoded.adminId}`);
    if (!session) {
      return next(new errorhandler(message, 401));
    }

    const admin = JSON.parse(session);

    const accessToken = jwt.sign(
      { adminId: admin.adminId, email: admin.email, role: admin.role },
      process.env.ACCESSTOKEN,
      { expiresIn: "5m" }
    );

    const refreshToken = jwt.sign(
      { adminId: admin.adminId },
      process.env.REFRESHTOKEN,
      { expiresIn: "7d" }
    );

    await redis.set(`admin:${admin.adminId}`, session, 'EX', 604800); // 7 days

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken
    });

  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});



// ✅ Forgot Password Request with old + new password
export const forgotPasswordWithOldPass = catchAsyncError(async (req, res, next) => {
  const { email, oldPassword, newPassword } = req.body;

  // if (!email || !oldPassword || !newPassword) {
  //   return next(new errorhandler("Email, old password, and new password are required", 400));
  // }

  if (!email || !newPassword) {
    return next(new errorhandler("Email, old password, and new password are required", 400));
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return next(new errorhandler("Admin not found", 404));
  }

  // Store passwords temporarily for verification after OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`reset:${email}`, JSON.stringify({ otp, oldPassword, newPassword }), 'EX', 900);

  try {
    await sendAdminInfoEmail({
      email,
      subject: "Password Change OTP",
      template: "forgot-password.ejs",
      data: {
        activationCode: otp,
        name: "Admin"
      }
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email for password change',
      email
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});


// ✅ Verify OTP and change password
export const verifyOtpAndChangePassword = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new errorhandler("Email and OTP are required", 400));
  }

  const storedData = await redis.get(`reset:${email}`);
  if (!storedData) {
    return next(new errorhandler("No OTP request found or expired", 400));
  }

  const { otp: storedOtp, oldPassword, newPassword } = JSON.parse(storedData);

  if (storedOtp !== otp.toString()) {
    return next(new errorhandler("Invalid OTP", 401));
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return next(new errorhandler("Admin not found", 404));
  }

  // Verify old password
  const isMatch = await bcrypt.compare(oldPassword, admin.password);
  if (!isMatch) {
    return next(new errorhandler("Old password is incorrect", 401));
  }

  // Update password
  const salt = await bcrypt.genSalt(10);
  admin.password = await bcrypt.hash(newPassword, salt);
  await admin.save();

  // Cleanup
  await redis.del(`reset:${email}`);

  await sendAdminInfoEmail({
    email,
    subject: "Password Changed Successfully",
    template: "password-reset-success.ejs",
    data: {
      name: "Admin",
      date: new Date().toLocaleString()
    }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});
