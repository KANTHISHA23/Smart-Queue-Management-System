/**
 * Organization service — registration/login for service providers (multi-tenant)
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const organizationRepository = require('../repositories/organization.repository');

function generateOrgTokens(org) {
  const accessToken = jwt.sign(
    {
      id: org.id,
      role: 'organization',
      name: org.name,
      email: org.email,
      organizationId: org.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { id: org.id, role: 'organization', organizationId: org.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

async function register(body) {
  const name = String(body.name || '').trim();
  const normalizedEmail = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const type = typeof body.type === 'string' ? body.type.trim() : body.type;

  const existing = await organizationRepository.findIdByEmail(normalizedEmail);
  if (existing.rows.length > 0) {
    return { ok: false, status: 409, message: 'An organization with this email already exists.' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await organizationRepository.insertOrganization(name, normalizedEmail, passwordHash, type);
  const org = result.rows[0];
  const tokens = generateOrgTokens(org);

  return {
    ok: true,
    status: 201,
    message: 'Organization registered successfully.',
    data: {
      organization: { id: org.id, name: org.name, email: org.email, type: org.type },
      ...tokens,
    },
  };
}

async function login(body) {
  const normalizedEmail = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const result = await organizationRepository.findByEmailForLogin(normalizedEmail);
  if (result.rows.length === 0) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const org = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, org.password_hash);
  if (!isValidPassword) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const tokens = generateOrgTokens(org);
  return {
    ok: true,
    message: 'Organization login successful.',
    data: {
      organization: { id: org.id, name: org.name, email: org.email, type: org.type },
      ...tokens,
    },
  };
}

module.exports = { register, login };

