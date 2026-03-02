import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Labour from '../models/Labour.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/apiResponse.js';

const generateToken = ({ id, role, kind }) =>
  jwt.sign({ id, role, kind }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
const normalizePhone = (value) => String(value || '').replace(/\s+/g, '').trim();

const DATA_IMAGE_REGEX = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;
const MAX_PROFILE_IMAGE_LENGTH = 200000;

const normalizeProfileImage = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value !== 'string') {
    const error = new Error('profileImage must be a string.');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.length > MAX_PROFILE_IMAGE_LENGTH) {
    const error = new Error('Profile image is too large.');
    error.statusCode = 400;
    throw error;
  }

  const isDataImage = DATA_IMAGE_REGEX.test(trimmed);
  let isHttpUrl = false;

  try {
    const parsed = new URL(trimmed);
    isHttpUrl = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (_) {
    isHttpUrl = false;
  }

  if (!isDataImage && !isHttpUrl) {
    const error = new Error('Use a valid image URL or base64 image.');
    error.statusCode = 400;
    throw error;
  }

  return trimmed;
};

const serializeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  profileImage: admin.profileImage || ''
});

const serializeLabourAuth = (labour) => ({
  id: labour._id,
  labourId: labour._id,
  name: labour.name,
  phone: labour.phone,
  section: labour.section || '',
  role: 'labour',
  profileImage: labour.profileImage || ''
});

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (!admin) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await admin.comparePassword(password);

  if (!isValid) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: admin._id,
    role: admin.role,
    kind: 'admin'
  });

  return sendSuccess(
    res,
    {
      token,
      admin: serializeAdmin(admin)
    },
    'Login successful'
  );
};

export const loginLabour = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    const error = new Error('Mobile number and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const labour = await Labour.findOne({ phone: normalizePhone(phone) });

  if (!labour || !labour.password) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await labour.comparePassword(password);

  if (!isValid) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: labour._id,
    role: 'labour',
    kind: 'labour'
  });

  return sendSuccess(
    res,
    {
      token,
      admin: serializeLabourAuth(labour)
    },
    'Login successful'
  );
};

export const getMe = async (req, res) => {
  const profile = req.userType === 'labour' ? serializeLabourAuth(req.user) : serializeAdmin(req.user);

  return sendSuccess(
    res,
    {
      admin: profile
    },
    'Profile fetched successfully'
  );
};

export const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    const error = new Error('Name, email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const allowedRole = role || 'manager';

  if (!['super_admin', 'admin', 'manager'].includes(allowedRole)) {
    const error = new Error('Invalid role.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    const error = new Error('Admin already exists with this email.');
    error.statusCode = 409;
    throw error;
  }

  const created = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: allowedRole,
    profileImage: normalizeProfileImage(req.body.profileImage)
  });

  return sendSuccess(
    res,
    {
      admin: serializeAdmin(created)
    },
    'Admin created successfully',
    201
  );
};

export const getAllAdmins = async (req, res) => {
  const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
  return sendSuccess(res, admins, 'Admins fetched successfully');
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid admin id.');
    error.statusCode = 400;
    throw error;
  }

  const target = await Admin.findById(id);

  if (!target) {
    const error = new Error('Admin not found.');
    error.statusCode = 404;
    throw error;
  }

  if (target._id.toString() === req.user._id.toString()) {
    const error = new Error('You cannot delete your own account.');
    error.statusCode = 400;
    throw error;
  }

  if (target.role === 'super_admin') {
    const error = new Error('Super admin account cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }

  await target.deleteOne();

  return sendSuccess(res, null, 'Admin deleted successfully');
};

export const updateMyProfileImage = async (req, res) => {
  const normalizedImage = normalizeProfileImage(req.body.profileImage);

  req.user.profileImage = normalizedImage;
  await req.user.save();

  const serializedUser = req.userType === 'labour' ? serializeLabourAuth(req.user) : serializeAdmin(req.user);

  return sendSuccess(
    res,
    { admin: serializedUser },
    normalizedImage ? 'Profile picture updated successfully' : 'Profile picture removed successfully'
  );
};
