const db = require('./index');

async function criar({ nome, email, senha, role = 'funcionario', acesso = 'ambos' }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome, email, senha, role, acesso) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, role, acesso`,
    [nome, email, senha, role, acesso]
  );
  return rows[0];
}

async function buscarPorEmail(email) {
  const { rows } = await db.query(
    `SELECT * FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(
    `SELECT id, nome, email, role, acesso, ativo, criado_em, permissoes FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function listar() {
  const { rows } = await db.query(
    `SELECT id, nome, email, role, acesso, ativo, criado_em, permissoes FROM usuarios ORDER BY nome`
  );
  return rows;
}

async function atualizar(id, { nome, email, role, acesso, ativo }) {
  const { rows } = await db.query(
    `UPDATE usuarios SET nome = $1, email = $2, role = $3, acesso = $4, ativo = $5
     WHERE id = $6 RETURNING id, nome, email, role, acesso, ativo`,
    [nome, email, role, acesso || 'ambos', ativo, id]
  );
  return rows[0] || null;
}

async function atualizarSenha(id, senhaNova) {
  await db.query(`UPDATE usuarios SET senha = $1 WHERE id = $2`, [senhaNova, id]);
}

async function atualizarPermissoes(id, permissoes) {
  const { rows } = await db.query(
    `UPDATE usuarios SET permissoes = $1 WHERE id = $2 RETURNING id`,
    [JSON.stringify(permissoes), id]
  );
  return rows[0] || null;
}

async function excluir(id) {
  await db.query(`DELETE FROM usuarios WHERE id = $1`, [id]);
}

module.exports = { criar, buscarPorEmail, buscarPorId, listar, atualizar, atualizarSenha, atualizarPermissoes, excluir };
