const db = require('./index');

async function listar(apenasAtivos = true, secao = null) {
  const conds  = [];
  const params = [];
  if (apenasAtivos) conds.push('ativo = TRUE');
  if (secao && secao !== 'ambos') {
    params.push(secao);
    conds.push(`(secao = $${params.length} OR secao = 'ambos')`);
  }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const { rows } = await db.query(
    `SELECT * FROM funcionarios ${where} ORDER BY nome`,
    params
  );
  return rows;
}

async function criar({ nome, funcao, secao = 'ambos' }) {
  const { rows } = await db.query(
    `INSERT INTO funcionarios (nome, funcao, secao) VALUES ($1, $2, $3) RETURNING *`,
    [nome, funcao || null, secao]
  );
  return rows[0];
}

async function atualizar(id, { nome, funcao, secao, ativo }) {
  const { rows } = await db.query(
    `UPDATE funcionarios SET nome = $1, funcao = $2, secao = $3, ativo = $4
     WHERE id = $5 RETURNING *`,
    [nome, funcao || null, secao, ativo, id]
  );
  return rows[0] || null;
}

async function excluir(id) {
  await db.query(`DELETE FROM funcionarios WHERE id = $1`, [id]);
}

module.exports = { listar, criar, atualizar, excluir };
