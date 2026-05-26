const db = require('./index');

async function criar({ nome }) {
  const { rows } = await db.query(
    `INSERT INTO motivos (nome) VALUES ($1) RETURNING *`,
    [nome]
  );
  return rows[0];
}

async function listar(apenasAtivos = true) {
  const condicao = apenasAtivos ? 'WHERE ativo = TRUE' : '';
  const { rows } = await db.query(
    `SELECT * FROM motivos ${condicao} ORDER BY nome`
  );
  return rows;
}

async function atualizar(id, { nome, ativo }) {
  const { rows } = await db.query(
    `UPDATE motivos SET nome = $1, ativo = $2 WHERE id = $3 RETURNING *`,
    [nome, ativo, id]
  );
  return rows[0] || null;
}

async function excluir(id) {
  await db.query(`DELETE FROM motivos WHERE id = $1`, [id]);
}

module.exports = { criar, listar, atualizar, excluir };
