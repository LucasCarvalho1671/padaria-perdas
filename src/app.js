require('dotenv').config();

const express     = require('express');
const path        = require('path');
const helmet      = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit   = require('express-rate-limit');

const { router: authRouter } = require('./web/auth');
const apiRoutes = require('./web/routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── Parsers ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Arquivos estáticos (frontend) ──────────────────────────
app.use(express.static(path.join(__dirname, 'web', 'public')));

// ── Rotas da API ───────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api',      apiRoutes);

// ── SPA: qualquer rota desconhecida → index.html ───────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'public', 'index.html'));
});

// ── Iniciar servidor ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍞 Padaria Perdas rodando em http://localhost:${PORT}\n`);
});
