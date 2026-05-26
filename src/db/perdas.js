const db = require('./index');

async function criar({ produto_id, motivo_id, quantidade, valor_total, data, observacao, usuario_id }) {
  const { rows } = await db.query(
    `INSERT INTO perdas (produto_id, motivo_id, quantidade, valor_total, data, observacao, usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [produto_id, motivo_id, quantidade, valor_total || null, data, observacao || null, usuario_id]
  );
  return rows[0];
}

async function listar({ dataInicio, dataFim, produto_id, motivo_id } = {}) {
  const filtros = ['1=1'];
  const params = [];

  if (dataInicio) { params.push(dataInicio); filtros.push(`p.data >= $${params.length}`); }
  if (dataFim)    { params.push(dataFim);    filtros.push(`p.data <= $${params.length}`); }
  if (produto_id) { params.push(produto_id); filtros.push(`p.produto_id = $${params.length}`); }
  if (motivo_id)  { params.push(motivo_id);  filtros.push(`p.motivo_id = $${params.length}`); }

  const { rows } = await db.query(
    `SELECT
       p.*,
       pr.nome  AS produto_nome,
       pr.unidade,
       pr.imagem_url,
       m.nome   AS motivo_nome,
       u.nome   AS usuario_nome
     FROM perdas p
     JOIN produtos  pr ON pr.id = p.produto_id
     JOIN motivos   m  ON m.id  = p.motivo_id
     JOIN usuarios  u  ON u.id  = p.usuario_id
     WHERE ${filtros.join(' AND ')}
     ORDER BY p.data DESC, p.criado_em DESC`,
    params
  );
  return rows;
}

async function excluir(id) {
  await db.query(`DELETE FROM perdas WHERE id = $1`, [id]);
}

async function resumoDashboard() {
  const { rows } = await db.query(`
    SELECT
      COUNT(*)                                         AS total_registros,
      COALESCE(SUM(quantidade), 0)                     AS total_quantidade,
      COALESCE(SUM(valor_total), 0)                    AS total_valor,
      COUNT(*) FILTER (WHERE data >= NOW() - INTERVAL '7 days')  AS registros_semana,
      COALESCE(SUM(valor_total) FILTER (WHERE data >= NOW() - INTERVAL '7 days'), 0) AS valor_semana,
      COUNT(*) FILTER (WHERE data >= DATE_TRUNC('month', NOW())) AS registros_mes,
      COALESCE(SUM(valor_total) FILTER (WHERE data >= DATE_TRUNC('month', NOW())), 0) AS valor_mes
    FROM perdas
  `);
  return rows[0];
}

async function topProdutosPerdidos(limite = 5) {
  const { rows } = await db.query(
    `SELECT
       pr.nome,
       pr.imagem_url,
       SUM(p.quantidade)              AS total_quantidade,
       COALESCE(SUM(p.valor_total),0) AS total_valor,
       COUNT(*)                       AS total_registros
     FROM perdas p
     JOIN produtos pr ON pr.id = p.produto_id
     WHERE p.data >= DATE_TRUNC('month', NOW())
     GROUP BY pr.id, pr.nome, pr.imagem_url
     ORDER BY total_quantidade DESC
     LIMIT $1`,
    [limite]
  );
  return rows;
}

async function perdasPorMotivo() {
  const { rows } = await db.query(`
    SELECT
      m.nome,
      COUNT(*)                        AS total_registros,
      COALESCE(SUM(p.valor_total), 0) AS total_valor
    FROM perdas p
    JOIN motivos m ON m.id = p.motivo_id
    WHERE p.data >= DATE_TRUNC('month', NOW())
    GROUP BY m.id, m.nome
    ORDER BY total_registros DESC
  `);
  return rows;
}

module.exports = { criar, listar, excluir, resumoDashboard, topProdutosPerdidos, perdasPorMotivo };
