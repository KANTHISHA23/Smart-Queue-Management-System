/**
 * Auth service — registration, login, tokens, profile
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const organizationRepository = require('../repositories/organization.repository');
const { UPLOAD_DIR } = require('../middleware/uploadAvatar');

function mapUserProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatar_url: row.avatar_url,
    avatarUrl: row.avatar_url,
    created_at: row.created_at,
  };
}

function mapOrgProfile(org) {
  return {
    id: org.id,
    name: org.name,
    email: org.email,
    phone: null,
    role: 'organization',
    type: org.type,
    avatar_url: org.avatar_url,
    avatarUrl: org.avatar_url,
    created_at: org.created_at,
  };
}

function deleteLocalAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;
  const filename = path.basename(avatarUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn('Failed to delete old avatar:', error.message);
    }
  }
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
}

async function register(body) {
  const normalizedEmail = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone;

  const existing = await authRepository.findIdByEmail(normalizedEmail);
  if (existing.rows.length > 0) {
    return { ok: false, status: 409, message: 'An account with this email already exists.' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await authRepository.insertUser(name, normalizedEmail, passwordHash, phone);
  const user = result.rows[0];
  const tokens = generateTokens(user);

  return {
    ok: true,
    status: 201,
    message: 'Account created successfully.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    },
  };
}

async function login(body) {
  const normalizedEmail = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const result = await authRepository.findByEmailForLogin(normalizedEmail);
  if (result.rows.length === 0) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const user = result.rows[0];

  if (!user.is_active) {
    return { ok: false, status: 403, message: 'Your account has been deactivated. Contact support.' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const tokens = generateTokens(user);

  return {
    ok: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
      ...tokens,
    },
  };
}

async function refreshAccessToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    return { ok: false, status: 400, message: 'Refresh token is required.' };
  }

  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const result = await authRepository.findByIdForRefresh(decoded.id);

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return { ok: false, status: 401, message: 'Invalid refresh token.' };
    }

    const user = result.rows[0];
    const tokens = generateTokens(user);
    return { ok: true, data: tokens };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired refresh token.' };
  }
}

async function getProfile(userId, role) {
  if (role === 'organization') {
    const result = await organizationRepository.findById(userId);
    if (result.rows.length === 0) {
      return { ok: false, status: 404, message: 'Organization not found.' };
    }
    const org = result.rows[0];
    return {
      ok: true,
      data: mapOrgProfile(org),
    };
  }

  const result = await authRepository.findProfileById(userId);
  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'User not found.' };
  }
  return { ok: true, data: mapUserProfile(result.rows[0]) };
}

async function updateProfile(userId, role, body) {
  const name = String(body.name || '').trim();
  const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone;

  if (!name || name.length < 2) {
    return { ok: false, status: 400, message: 'Name must be at least 2 characters.' };
  }

  if (role === 'organization') {
    const result = await organizationRepository.updateProfile(name, userId);
    const org = result.rows[0];
    return {
      ok: true,
      message: 'Profile updated successfully.',
      data: mapOrgProfile(org),
    };
  }

  const result = await authRepository.updateProfile(name, phone || null, userId);
  return {
    ok: true,
    message: 'Profile updated successfully.',
    data: mapUserProfile(result.rows[0]),
  };
}

async function uploadProfileAvatar(userId, role, file) {
  if (!file) {
    return { ok: false, status: 400, message: 'No image file provided.' };
  }

  const avatarPath = `/uploads/avatars/${file.filename}`;
  let oldAvatarUrl = null;

  if (role === 'organization') {
    const existing = await organizationRepository.findAvatarUrlById(userId);
    oldAvatarUrl = existing.rows[0]?.avatar_url;
    const result = await organizationRepository.updateAvatarUrl(avatarPath, userId);
    if (result.rows.length === 0) {
      return { ok: false, status: 404, message: 'Organization not found.' };
    }
    deleteLocalAvatar(oldAvatarUrl);
    return {
      ok: true,
      message: 'Profile photo updated successfully.',
      data: mapOrgProfile(result.rows[0]),
    };
  }

  const existing = await authRepository.findAvatarUrlById(userId);
  oldAvatarUrl = existing.rows[0]?.avatar_url;
  const result = await authRepository.updateAvatarUrl(avatarPath, userId);
  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'User not found.' };
  }
  deleteLocalAvatar(oldAvatarUrl);
  return {
    ok: true,
    message: 'Profile photo updated successfully.',
    data: mapUserProfile(result.rows[0]),
  };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
};
