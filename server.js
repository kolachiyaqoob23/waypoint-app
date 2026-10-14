'use strict';
/* Waypoint server: zero npm dependencies.
   Needs Node.js 22.13+ (uses the built-in node:sqlite module). */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { DatabaseSync } = require('node:sqlite');
const { BANDS, SUBJECTS, bandOf, topicResources } = require('./content');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_DAYS = 14;
const scrypt = promisify(crypto.scrypt);

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'waypoint.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    salt TEXT NOT NULL,
    hash TEXT NOT NULL,
    grade INTEGER NOT NULL,
    minutes INTEGER NOT NULL DEFAULT 30,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, subject_id)
  );
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    ts INTEGER NOT NULL,
    scope TEXT NOT NULL,
    topics TEXT NOT NULL,
    answers TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, subject_id);
  CREATE TABLE IF NOT EXISTS studied (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    PRIMARY KEY (user_id, subject_id, topic_id)
  );
`);

/* ---------- admin key (env var, or generated once and stored in data/admin.key) ---------- */
let ADMIN_KEY = process.env.ADMIN_KEY || '';
if (!ADMIN_KEY) {
  const f = path.join(DATA_DIR, 'admin.key');
  try { ADMIN_KEY = fs.readFileSync(f, 'utf8').trim(); } catch (e) { /* first run */ }
  if (!ADMIN_KEY) {
    ADMIN_KEY = crypto.randomBytes(12).toString('base64url');
    fs.writeFileSync(f, ADMIN_KEY + '\n', { mode: 0o600 });
  }
}

/* ---------- helpers ---------- */
const SUBJECT_BY_ID = new Map(SUBJECTS.map(s => [s.id, s]));
const QUESTION_BY_ID = new Map();
SUBJECTS.forEach(s => s.topics.forEach(t => t.questions.forEach(q => QUESTION_BY_ID.set(q.id, { q, s, t }))));

const httpErr = (status, message) => Object.assign(new Error(message), { status });
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cleanStr = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

function sendJson(res, status, obj, headers) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) }, headers || {}));
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 100 * 1024) { reject(httpErr(413, 'Request is too large.')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' ? v : {}); }
      catch (e) { reject(httpErr(400, 'Invalid JSON.')); }
    });
    req.on('error', reject);
  });
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
const isHttps = req => req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === '1';
function sessionCookie(req, token, maxAge) {
  return `wp_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}` + (isHttps(req) ? '; Secure' : '');
}
async function hashPassword(pw, salt) { return (await scrypt(pw, salt, 64)).toString('hex'); }
function safeEqualHex(a, b) {
  const ba = Buffer.from(a, 'hex'), bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAge = SESSION_DAYS * 86400;
  db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?,?,?)').run(sha256(token), userId, Date.now() + maxAge * 1000);
  return sessionCookie(req, token, maxAge);
}
function authUser(req) {
  const token = parseCookies(req).wp_session;
  if (!token) return null;
  const row = db.prepare('SELECT u.* , s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(sha256(token));
  if (!row) return null;
  if (row.expires_at < Date.now()) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token)); return null; }
  return row;
}
function requireUser(req) { const u = authUser(req); if (!u) throw httpErr(401, 'Please log in.'); return u; }
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, grade: u.grade, band: bandOf(u.grade), minutes: u.minutes });
const enrolledIds = uid => db.prepare('SELECT subject_id FROM enrollments WHERE user_id = ? ORDER BY created_at').all(uid).map(r => r.subject_id);

/* simple in-memory login throttle */
const fails = new Map();
function throttleCheck(key) {
  const f = fails.get(key);
  if (f && Date.now() - f.first > 10 * 60 * 1000) fails.delete(key);
  const g = fails.get(key);
  if (g && g.n >= 8) throw httpErr(429, 'Too many failed attempts. Try again in a few minutes.');
}
function throttleFail(key) { const f = fails.get(key); if (!f) fails.set(key, { n: 1, first: Date.now() }); else f.n++; }

/* ---------- learning logic ---------- */
const levelOf = p => (p >= 0.8 ? 'strong' : p >= 0.5 ? 'developing' : 'weak');
function loadAttempts(uid, sid) {
  return db.prepare('SELECT id, ts, scope, topics, answers FROM attempts WHERE user_id = ? AND subject_id = ? ORDER BY id').all(uid, sid)
    .map(r => ({ id: r.id, ts: r.ts, scope: r.scope, topics: JSON.parse(r.topics), answers: JSON.parse(r.answers) }));
}
function latestResults(attempts) {
  const r = {};
  attempts.forEach(a => Object.keys(a.topics).forEach(t => { r[t] = a.topics[t]; }));
  return r;
}
function missedFor(attempts, tid) {
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].topics[tid]) {
      return attempts[i].answers.filter(a => a.tid === tid && !a.ok).map(a => {
        const info = QUESTION_BY_ID.get(a.qid);
        return info ? { qid: a.qid, q: info.q.q, code: info.q.code || null, chosen: a.chosen, correct: info.q.opts[0], why: info.q.why } : null;
      }).filter(Boolean);
    }
  }
  return [];
}

/* ---------- API handlers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function register(req, res) {
  const b = await readJson(req);
  const name = cleanStr(b.name, 60), email = cleanStr(b.email, 120).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const grade = Number(b.grade);
  if (name.length < 2) throw httpErr(400, 'Please enter your full name.');
  if (!EMAIL_RE.test(email)) throw httpErr(400, 'Please enter a valid email address.');
  if (password.length < 8 || password.length > 100) throw httpErr(400, 'Password must be 8 to 100 characters long.');
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) throw httpErr(400, 'Please choose your class (1 to 12).');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw httpErr(409, 'An account with this email already exists. Log in instead.');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPassword(password, salt);
  const info = db.prepare('INSERT INTO users(name, email, salt, hash, grade, minutes, created_at) VALUES(?,?,?,?,?,?,?)').run(name, email, salt, hash, grade, 30, Date.now());
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  const cookie = createSession(req, res, user.id);
  sendJson(res, 201, { user: publicUser(user), enrolled: [] }, { 'Set-Cookie': cookie });
}

async function login(req, res) {
  const b = await readJson(req);
  const email = cleanStr(b.email, 120).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const key = (req.socket.remoteAddress || '') + '|' + email;
  throttleCheck(key);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const salt = user ? user.salt : '00'.repeat(16);
  const hash = await hashPassword(password, salt);   // always hash, so timing doesn't reveal if the email exists
  if (!user || !safeEqualHex(hash, user.hash)) { throttleFail(key); throw httpErr(401, 'Email or password is incorrect.'); }
  fails.delete(key);
  const cookie = createSession(req, res, user.id);
  sendJson(res, 200, { user: publicUser(user), enrolled: enrolledIds(user.id) }, { 'Set-Cookie': cookie });
}

function logout(req, res) {
  const token = parseCookies(req).wp_session;
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
}

function catalog(req, res) {
  const user = requireUser(req);
  sendJson(res, 200, {
    bands: BANDS,
    subjects: SUBJECTS.map(s => ({
      id: s.id, title: s.title, area: s.area, blurb: s.blurb, bands: s.bands, resources: s.resources,
      topics: s.topics.map(t => ({ id: t.id, name: t.name, lesson: t.lesson, points: t.points, resources: topicResources(s, t, user.grade) }))
    }))
  });
}

function progress(req, res) {
  const user = requireUser(req);
  const out = {};
  const sids = new Set(enrolledIds(user.id));
  db.prepare('SELECT DISTINCT subject_id FROM attempts WHERE user_id = ?').all(user.id).forEach(r => sids.add(r.subject_id));
  sids.forEach(sid => {
    const s = SUBJECT_BY_ID.get(sid); if (!s) return;
    const attempts = loadAttempts(user.id, sid);
    const studied = {};
    db.prepare('SELECT topic_id FROM studied WHERE user_id = ? AND subject_id = ?').all(user.id, sid).forEach(r => { studied[r.topic_id] = true; });
    const missed = {};
    s.topics.forEach(t => { missed[t.id] = missedFor(attempts, t.id); });
    out[sid] = { attempts: attempts.map(a => ({ id: a.id, ts: a.ts, scope: a.scope, topics: a.topics })), studied, missed };
  });
  sendJson(res, 200, { subjects: out });
}

async function updateProfile(req, res) {
  const user = requireUser(req);
  const b = await readJson(req);
  let name = user.name, grade = user.grade, minutes = user.minutes;
  if (b.name !== undefined) { name = cleanStr(b.name, 60); if (name.length < 2) throw httpErr(400, 'Please enter your full name.'); }
  if (b.grade !== undefined) { grade = Number(b.grade); if (!Number.isInteger(grade) || grade < 1 || grade > 12) throw httpErr(400, 'Please choose a class from 1 to 12.'); }
  if (b.minutes !== undefined) { minutes = Number(b.minutes); if (![15, 30, 45, 60, 90].includes(minutes)) throw httpErr(400, 'Invalid study time.'); }
  db.prepare('UPDATE users SET name = ?, grade = ?, minutes = ? WHERE id = ?').run(name, grade, minutes, user.id);
  sendJson(res, 200, { user: publicUser({ ...user, name, grade, minutes }) });
}

async function enroll(req, res) {
  const user = requireUser(req);
  const b = await readJson(req);
  if (!SUBJECT_BY_ID.has(b.subjectId)) throw httpErr(404, 'Unknown subject.');
  db.prepare('INSERT OR IGNORE INTO enrollments(user_id, subject_id, created_at) VALUES(?,?,?)').run(user.id, b.subjectId, Date.now());
  sendJson(res, 200, { enrolled: enrolledIds(user.id) });
}
function unenroll(req, res, sid) {
  const user = requireUser(req);
  db.prepare('DELETE FROM enrollments WHERE user_id = ? AND subject_id = ?').run(user.id, sid);
  sendJson(res, 200, { enrolled: enrolledIds(user.id) });
}

async function quizStart(req, res) {
  const user = requireUser(req);
  const b = await readJson(req);
  const s = SUBJECT_BY_ID.get(b.subjectId);
  if (!s) throw httpErr(404, 'Unknown subject.');
  const scope = b.scope === 'focus' ? 'focus' : 'full';
  db.prepare('INSERT OR IGNORE INTO enrollments(user_id, subject_id, created_at) VALUES(?,?,?)').run(user.id, s.id, Date.now());
  const attempts = loadAttempts(user.id, s.id);
  const res0 = latestResults(attempts);
  const seen = new Set();
  attempts.forEach(a => a.answers.forEach(x => seen.add(x.qid)));
  let topics = s.topics;
  if (scope === 'focus') {
    topics = s.topics.filter(t => res0[t.id] && levelOf(res0[t.id].correct / res0[t.id].total) !== 'strong');
    if (!topics.length) throw httpErr(400, 'All topics are strong. Take the full diagnostic instead.');
  }
  const items = [];
  topics.forEach(t => {
    const fresh = shuffle(t.questions.filter(q => !seen.has(q.id)));
    const old = shuffle(t.questions.filter(q => seen.has(q.id)));
    fresh.concat(old).slice(0, 3).forEach(q => items.push({ qid: q.id, tid: t.id, q: q.q, code: q.code || null, options: shuffle(q.opts) }));
  });
  sendJson(res, 200, { scope, items: shuffle(items) });
}

async function quizSubmit(req, res) {
  const user = requireUser(req);
  const b = await readJson(req);
  const s = SUBJECT_BY_ID.get(b.subjectId);
  if (!s) throw httpErr(404, 'Unknown subject.');
  const scope = b.scope === 'focus' ? 'focus' : 'full';
  if (!Array.isArray(b.answers) || !b.answers.length || b.answers.length > 40) throw httpErr(400, 'No answers received.');
  const seenQ = new Set(), topics = {}, answers = [];
  for (const a of b.answers) {
    const info = a && typeof a.qid === 'string' ? QUESTION_BY_ID.get(a.qid) : null;
    if (!info || info.s.id !== s.id || seenQ.has(a.qid) || typeof a.chosen !== 'string') throw httpErr(400, 'Invalid answer data.');
    seenQ.add(a.qid);
    const ok = a.chosen === info.q.opts[0];
    const tt = topics[info.t.id] || (topics[info.t.id] = { correct: 0, total: 0 });
    tt.total++; if (ok) tt.correct++;
    answers.push({ qid: a.qid, tid: info.t.id, chosen: a.chosen.slice(0, 300), ok });
  }
  const previous = latestResults(loadAttempts(user.id, s.id));
  db.prepare('INSERT INTO attempts(user_id, subject_id, ts, scope, topics, answers) VALUES(?,?,?,?,?,?)').run(user.id, s.id, Date.now(), scope, JSON.stringify(topics), JSON.stringify(answers));
  const del = db.prepare('DELETE FROM studied WHERE user_id = ? AND subject_id = ? AND topic_id = ?');
  Object.keys(topics).forEach(t => del.run(user.id, s.id, t));
  db.prepare('INSERT OR IGNORE INTO enrollments(user_id, subject_id, created_at) VALUES(?,?,?)').run(user.id, s.id, Date.now());
  sendJson(res, 200, { scope, topics, previous });
}

async function setStudied(req, res) {
  const user = requireUser(req);
  const b = await readJson(req);
  const s = SUBJECT_BY_ID.get(b.subjectId);
  if (!s || !s.topics.some(t => t.id === b.topicId)) throw httpErr(404, 'Unknown topic.');
  if (b.studied) db.prepare('INSERT OR IGNORE INTO studied(user_id, subject_id, topic_id) VALUES(?,?,?)').run(user.id, s.id, b.topicId);
  else db.prepare('DELETE FROM studied WHERE user_id = ? AND subject_id = ? AND topic_id = ?').run(user.id, s.id, b.topicId);
  sendJson(res, 200, { ok: true });
}

function resetSubject(req, res, sid) {
  const user = requireUser(req);
  if (!SUBJECT_BY_ID.has(sid)) throw httpErr(404, 'Unknown subject.');
  db.prepare('DELETE FROM attempts WHERE user_id = ? AND subject_id = ?').run(user.id, sid);
  db.prepare('DELETE FROM studied WHERE user_id = ? AND subject_id = ?').run(user.id, sid);
  sendJson(res, 200, { ok: true });
}

function adminStudents(req, res) {
  const key = String(req.headers['x-admin-key'] || '');
  const a = Buffer.from(sha256(key), 'hex'), c = Buffer.from(sha256(ADMIN_KEY), 'hex');
  if (!crypto.timingSafeEqual(a, c)) throw httpErr(401, 'Wrong admin key.');
  const users = db.prepare('SELECT id, name, email, grade, created_at FROM users ORDER BY id').all();
  const students = users.map(u => {
    const subjects = enrolledIds(u.id).map(sid => {
      const s = SUBJECT_BY_ID.get(sid); if (!s) return null;
      const attempts = loadAttempts(u.id, sid), r = latestResults(attempts);
      const vals = s.topics.filter(t => r[t.id]).map(t => r[t.id].correct / r[t.id].total);
      return { id: sid, title: s.title, attempts: attempts.length, readiness: vals.length ? Math.round(100 * vals.reduce((x, y) => x + y, 0) / vals.length) : null };
    }).filter(Boolean);
    const band = bandOf(u.grade);
    return { id: u.id, name: u.name, email: u.email, grade: u.grade, category: band ? band.label : '', created_at: u.created_at, subjects };
  });
  sendJson(res, 200, { total: students.length, students });
}

async function handleApi(req, res, p) {
  const m = req.method;
  if (m !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) throw httpErr(415, 'Content-Type must be application/json.');
  if (m === 'POST' && p === '/api/register') return register(req, res);
  if (m === 'POST' && p === '/api/login') return login(req, res);
  if (m === 'POST' && p === '/api/logout') return logout(req, res);
  if (m === 'GET' && p === '/api/me') { const u = requireUser(req); return sendJson(res, 200, { user: publicUser(u), enrolled: enrolledIds(u.id) }); }
  if (m === 'GET' && p === '/api/catalog') return catalog(req, res);
  if (m === 'GET' && p === '/api/progress') return progress(req, res);
  if (m === 'PUT' && p === '/api/profile') return updateProfile(req, res);
  if (m === 'POST' && p === '/api/enroll') return enroll(req, res);
  if (m === 'POST' && p === '/api/quiz/start') return quizStart(req, res);
  if (m === 'POST' && p === '/api/quiz/submit') return quizSubmit(req, res);
  if (m === 'POST' && p === '/api/studied') return setStudied(req, res);
  if (m === 'GET' && p === '/api/admin/students') return adminStudents(req, res);
  if (m === 'GET' && p === '/api/health') return sendJson(res, 200, { ok: true });
  let mm;
  if (m === 'DELETE' && (mm = p.match(/^\/api\/enroll\/([a-z0-9_-]+)$/))) return unenroll(req, res, mm[1]);
  if (m === 'DELETE' && (mm = p.match(/^\/api\/progress\/([a-z0-9_-]+)$/))) return resetSubject(req, res, mm[1]);
  throw httpErr(404, 'Not found.');
}

/* ---------- static files ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
function serveStatic(req, res, p) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw httpErr(405, 'Method not allowed.');
  if (p === '/') p = '/index.html';
  if (p === '/admin') p = '/admin.html';
  let file;
  try { file = path.join(PUBLIC_DIR, decodeURIComponent(p)); } catch (e) { throw httpErr(400, 'Bad path.'); }
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw httpErr(404, 'Not found.');
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    const p = new URL(req.url, 'http://localhost').pathname;
    if (p.startsWith('/api/')) await handleApi(req, res, p);
    else serveStatic(req, res, p);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) {
      if ((req.url || '').startsWith('/api/')) sendJson(res, status, { error: status === 500 ? 'Server error. Please try again.' : e.message });
      else { res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(status === 404 ? 'Page not found' : e.message); }
    }
  }
});

server.listen(PORT, () => {
  console.log(`Waypoint is running at http://localhost:${PORT}`);
  console.log(`Database: ${path.join(DATA_DIR, 'waypoint.db')}`);
  console.log(`Admin page: http://localhost:${PORT}/admin   (admin key: ${ADMIN_KEY})`);
});

/* clean up expired sessions every hour */
setInterval(() => { try { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); } catch (e) { /* ignore */ } }, 3600 * 1000).unref();
