const db = require('./index');

async function criar({ nome, unidade, custo, valor_cobranca, imagem_url, secao = 'padaria' }) {
  const { rows } = await db.query(
    `INSERT INTO produtos (nome, unidade, custo, valor_cobranca, imagem_url, secao)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nome, unidade || 'unidade', custo || null, valor_cobranca || null, imagem_url || null, secao]
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
    `SELECT * FROM produtos ${where} ORDER BY favorito DESC, nome`,
    params
  );
  return rows;
}

async function toggleFavorito(id) {
  const { rows } = await db.query(
    `UPDATE produtos SET favorito = NOT favorito WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT * FROM produtos WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function atualizar(id, { nome, unidade, custo, valor_cobranca, imagem_url, ativo }) {
  const { rows } = await db.query(
    `UPDATE produtos SET nome = $1, unidade = $2, custo = $3, valor_cobranca = $4,
     imagem_url = $5, ativo = $6 WHERE id = $7 RETURNING *`,
    [nome, unidade, custo || null, valor_cobranca || null, imagem_url || null, ativo, id]
  );
  return rows[0] || null;
}

async function excluir(id) {
  await db.query(`DELETE FROM produtos WHERE id = $1`, [id]);
}

module.exports = { criar, listar, buscarPorId, atualizar, excluir, toggleFavorito };
