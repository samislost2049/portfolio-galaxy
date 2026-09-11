import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-before-deploying';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const contactLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const visitLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

const today = () => new Date().toISOString().slice(0, 10);

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existing = await query('SELECT id FROM admins WHERE email = ?', [ADMIN_EMAIL]);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [ADMIN_EMAIL, hash]);
    console.log('Admin account created for ' + ADMIN_EMAIL);
  }
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/contact', contactLimiter, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const message = String(req.body.message || '').trim();
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (name.length > 200 || email.length > 254 || message.length > 5000)
      return res.status(400).json({ error: 'Field too long' });
    const rows = await query(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?) RETURNING id',
      [name, email, message]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

app.post('/api/visit', visitLimiter, async (req, res, next) => {
  try {
    await query(
      'INSERT INTO visits (day, count) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET count = visits.count + 1',
      [today()]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const rows = await query('SELECT id, email, password_hash FROM admins WHERE email = ?', [email]);
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: 'Wrong email or password' });
    const token = jwt.sign({ sub: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/stats', auth, async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
    const [totalMsg] = await query('SELECT COUNT(*) AS c FROM messages');
    const [visitTotals] = await query('SELECT COALESCE(SUM(count), 0) AS total FROM visits');
    const [todayVisits] = await query('SELECT COALESCE(SUM(count), 0) AS total FROM visits WHERE day = ?', [today()]);
    const dayRows = await query('SELECT day, count FROM visits WHERE day >= ? ORDER BY day ASC', [since]);
    const recent = await query(
      'SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC LIMIT 20'
    );
    const byDay = new Map(dayRows.map((r) => [String(r.day).slice(0, 10), Number(r.count)]));
    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      last14.push({ day: d, visits: byDay.get(d) || 0 });
    }
    res.json({
      totalMessages: Number(totalMsg ? totalMsg.c : 0),
      totalVisits: Number(visitTotals ? visitTotals.total : 0),
      todayVisits: Number(todayVisits ? todayVisits.total : 0),
      last14,
      recent,
    });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/messages/:id', auth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    await query('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => res.redirect('/admin'));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const server = app.listen(PORT, async () => {
  try {
    await initDb();
    await seedAdmin();
    console.log(`Galaxy admin API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Startup failed:', err);
    server.close();
    process.exit(1);
  }
});