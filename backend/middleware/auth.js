const crypto = require('crypto');

const TOKEN_EXPIRES_IN_SECONDS = parseInt(process.env.ADMIN_TOKEN_TTL || '7200', 10); // 2 小時
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me';

function base64UrlEncode (buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode (str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function sign (payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verify (token) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    return { valid: false, reason: '格式錯誤' };
  }
  const [headerB64, payloadB64, signature] = token.split('.');
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { valid: false, reason: '簽章不正確' };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, reason: '已過期' };
    }
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, reason: '解析失敗' };
  }
}

function issueToken (subject = 'admin') {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    iat: nowSec,
    exp: nowSec + TOKEN_EXPIRES_IN_SECONDS,
    scope: ['admin'],
  };
  return sign(payload);
}

function extractTokenFromRequest (req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return null;
  const parts = String(authHeader).split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

function requireAdmin (req, res, next) {
  const token = extractTokenFromRequest(req);
  const result = verify(token);
  if (!result.valid) {
    return res.status(401).json({ error: '未授權', reason: result.reason });
  }
  req.admin = result.payload;
  next();
}

async function loginHandler (req, res) {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: '請提供密碼' });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    const token = issueToken('admin');
    res.json({ token, expiresIn: TOKEN_EXPIRES_IN_SECONDS });
  } catch (e) {
    res.status(500).json({ error: '登入失敗' });
  }
}

async function meHandler (req, res) {
  const token = extractTokenFromRequest(req);
  const result = verify(token);
  if (!result.valid) {
    return res.status(401).json({ error: '未授權' });
  }
  res.json({ user: { role: 'admin' }, tokenExp: result.payload.exp });
}

module.exports = {
  requireAdmin,
  loginHandler,
  meHandler,
  issueToken,
  verify,
};


