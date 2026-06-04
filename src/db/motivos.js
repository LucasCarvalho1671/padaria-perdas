const db = require('./index');

async function criar({ nome, secao = 'padaria', cobrar_negligencia = false }) {
  const { rows } = await db.query(
    `INSERT INTO motivos (nome, secao, cobrar_negligencia) VALUES ($1, $2, $3) RETURNING *`,
    [nome, secao, cobrar_negligencia]
  );
  return rows[0];
}

async function listar(apenasAtivos = true, secao = null) {
  const condicoes = [];
  const params    = [];
  if (apenasAtivos) condicoes.push('ativo = TRUE');
  if (secao) { params.push(secao); condicoes.push(`secao = $${params.length}`); }
  const where = condicoes.length ? 'WHERE ' + condicoes.join(' AND ') : '';
  const { rows } = await db.query(
    `SELECT * FROM motivos ${where} ORDER BY nome`,
    params
  );
  return rows;
}

async function atualizar(id, { nome, ativo, cobrar_negligencia }) {
  const { rows } = await db.query(
    `UPDATE motivos SET nome = $1, ativo = $2, cobrar_negligencia = $3 WHERE id = $4 RETURNING *`,
    [nome, ativo, cobrar_negligencia ?? false, id]
  );
  return rows[0] || null;
}

async function excluir(id) {
  await db.query(`DELETE FROM motivos WHERE id = $1`, [id]);
}

module.exports = { criar, listar, atualizar, excluir };
