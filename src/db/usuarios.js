const db = require('./index');

async function criar({ nome, email, senha, role = 'funcionario' }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role`,
    [nome, email, senha, role]
  );
  return rows[0];
}

async function buscarPorEmail(email) {
  const { rows } = await db.query(
    `SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE`,
    [email]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(
    `SELECT id, nome, email, role, ativo, criado_em FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function listar() {
  const { rows } = await db.query(
    `SELECT id, nome, email, role, ativo, criado_em FROM usuarios ORDER BY nome`
  );
  return rows;
}

async function atualizar(id, { nome, email, role, ativo }) {
  const { rows } = await db.query(
    `UPDATE usuarios SET nome = $1, email = $2, role = $3, ativo = $4
     WHERE id = $5 RETURNING id, nome, email, role, ativo`,
    [nome, email, role, ativo, id]
  );
  return rows[0] || null;
}

async function atualizarSenha(id, senhaNova) {
  await db.query(`UPDATE usuarios SET senha = $1 WHERE id = $2`, [senhaNova, id]);
}

async function excluir(id) {
  await db.query(`DELETE FROM usuarios WHERE id = $1`, [id]);
}

module.exports = { criar, buscarPorEmail, buscarPorId, listar, atualizar, atualizarSenha, excluir };
