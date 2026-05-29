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

// Permissões padrão de um funcionário comum
const PERMISSOES_PADRAO = {
  ver_dashboard:      true,
  ver_historico:      true,
  registrar_perda:    true,
  registrar_producao: true,
  editar_perda:       false,
  excluir_perda:      false,
  editar_producao:    false,
  excluir_producao:   false,
  exportar_relatorio: true,
  cadastrar_produto:  false,
  editar_produto:     false,
  excluir_produto:    false,
  gerenciar_motivos:  false,
  gerenciar_usuarios: false,
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

// Middleware: bloqueia quem não é admin
function apenasAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

// Middleware: verifica permissão específica (admin sempre passa)
function verificarPermissao(perm) {
  return (req, res, next) => {
    if (req.usuario?.role === 'admin') return next();
    const perms = { ...PERMISSOES_PADRAO, ...(req.usuario?.permissoes || {}) };
    if (perms[perm]) return next();
    return res.status(403).json({ erro: 'Sem permissão para esta ação.' });
  };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

    const usuario = await usuarios.buscarPorEmail(email);
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos.' });

    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Seu acesso está desativado. Procure um administrador para reativá-lo.' });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return res.status(401).json({ erro: 'Email ou senha incorretos.' });

    // Mescla permissões padrão com as permissões específicas do usuário
    const permissoes = { ...PERMISSOES_PADRAO, ...(usuario.permissoes || {}) };
    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, permissoes };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTS);
    res.json({ ok: true, usuario: payload });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const usuario = await usuarios.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    // Retorna permissões efetivas (padrão mesclado com específicas do usuário)
    const permissoes = { ...PERMISSOES_PADRAO, ...(usuario.permissoes || {}) };
    res.json({ ...usuario, permissoes });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
});

module.exports = { router, autenticar, apenasAdmin, verificarPermissao, PERMISSOES_PADRAO };
