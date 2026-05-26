const db = require('./index');

async function criar({ nome, unidade, custo, imagem_url }) {
  const { rows } = await db.query(
    `INSERT INTO produtos (nome, unidade, custo, imagem_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome, unidade || 'unidade', custo || null, imagem_url || null]
  );
  return rows[0];
}

async function listar(apenasAtivos = true) {
  const condicao = apenasAtivos ? 'WHERE ativo = TRUE' : '';
  const { rows } = await db.query(
    `SELECT * FROM produtos ${condicao} ORDER BY nome`
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT * FROM produtos WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function atualizar(id, { nome, unidade, custo, imagem_url, ativo }) {
  const { rows } = await db.query(
    `UPDATE produtos SET nome = $1, unidade = $2, custo = $3, imagem_url = $4, ativo = $5
     WHERE id = $6 RETURNING *`,
    [nome, unidade, custo || null, imagem_url || null, ativo, id]
  );
  return rows[0] || null;
}

module.exports = { criar, listar, buscarPorId, atualizar };
