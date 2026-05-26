const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const router  = express.Router();
const usuarios = require('../db/usuarios');

const JWT_SECRET  = process.env.JWT_SECRET;
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 dias
};

// Middleware: verifica se o usuário está logado
function autenticar(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ erro: 'Não autenticado.' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

  const usuario = await usuarios.buscarPorEmail(email);
  if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos.' });

  const senhaOk = await bcrypt.compare(senha, usuario.senha);
  if (!senhaOk) return res.status(401).json({ erro: 'Email ou senha incorretos.' });

  const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, COOKIE_OPTS);
  res.json({ ok: true, usuario: payload });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  const usuario = await usuarios.buscarPorId(req.usuario.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
});

// Middleware: bloqueia quem não é admin
function apenasAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { router, autenticar, apenasAdmin };
