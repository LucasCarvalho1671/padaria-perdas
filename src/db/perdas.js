const db = require('./index');

async function criar({ produto_id, motivo_id, quantidade, valor_total, data, observacao, usuario_id, secao = 'padaria', funcionario_cobrado_id, valor_cobrado }) {
  const { rows } = await db.query(
    `INSERT INTO perdas (produto_id, motivo_id, quantidade, valor_total, data, observacao, usuario_id, secao, funcionario_cobrado_id, valor_cobrado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [produto_id, motivo_id, quantidade, valor_total || null, data, observacao || null, usuario_id, secao, funcionario_cobrado_id || null, valor_cobrado || null]
  );
  return rows[0];
}

async function listar({ dataInicio, dataFim, produto_id, motivo_id, secao, funcionario_cobrado_id, apenas_com_cobranca } = {}) {
  const filtros = ['1=1'];
  const params = [];

  if (dataInicio)            { params.push(dataInicio);            filtros.push(`p.data >= $${params.length}`); }
  if (dataFim)               { params.push(dataFim);               filtros.push(`p.data <= $${params.length}`); }
  if (produto_id)            { params.push(produto_id);            filtros.push(`p.produto_id = $${params.length}`); }
  if (motivo_id)             { params.push(motivo_id);             filtros.push(`p.motivo_id = $${params.length}`); }
  if (secao)                 { params.push(secao);                 filtros.push(`p.secao = $${params.length}`); }
  if (funcionario_cobrado_id){ params.push(funcionario_cobrado_id);filtros.push(`p.funcionario_cobrado_id = $${params.length}`); }
  if (apenas_com_cobranca)   { filtros.push(`p.funcionario_cobrado_id IS NOT NULL`); }

  const { rows } = await db.query(
    `SELECT
       p.*,
       pr.nome  AS produto_nome,
       pr.unidade,
       pr.imagem_url,
       m.nome   AS motivo_nome,
       u.nome   AS usuario_nome,
       f.nome   AS funcionario_cobrado_nome
     FROM perdas p
     JOIN produtos    pr ON pr.id = p.produto_id
     JOIN motivos     m  ON m.id  = p.motivo_id
     JOIN usuarios    u  ON u.id  = p.usuario_id
     LEFT JOIN funcionarios f ON f.id = p.funcionario_cobrado_id
     WHERE ${filtros.join(' AND ')}
     ORDER BY p.data DESC, p.criado_em DESC`,
    params
  );
  return rows;
}

async function excluir(id) {
  await db.query(`DELETE FROM perdas WHERE id = $1`, [id]);
}

async function atualizar(id, { produto_id, motivo_id, quantidade, valor_total, data, observacao, funcionario_cobrado_id, valor_cobrado }) {
  const { rows } = await db.query(
    `UPDATE perdas
     SET produto_id = $1, motivo_id = $2, quantidade = $3, valor_total = $4,
         data = $5, observacao = $6, funcionario_cobrado_id = $7, valor_cobrado = $8
     WHERE id = $9 RETURNING *`,
    [produto_id, motivo_id, quantidade, valor_total ?? null, data, observacao || null,
     funcionario_cobrado_id || null, valor_cobrado || null, id]
  );
  return rows[0] || null;
}

async function resumoDashboard(secao = null) {
  const params  = [];
  const where   = secao ? `WHERE secao = $${params.push(secao)}` : '';
  const { rows } = await db.query(`
    SELECT
      COUNT(*)                                         AS total_registros,
      COALESCE(SUM(quantidade), 0)                     AS total_quantidade,
      COALESCE(SUM(valor_total), 0)                    AS total_valor,
      COUNT(*) FILTER (WHERE data >= NOW() - INTERVAL '7 days')  AS registros_semana,
      COALESCE(SUM(valor_total) FILTER (WHERE data >= NOW() - INTERVAL '7 days'), 0) AS valor_semana,
      COUNT(*) FILTER (WHERE data >= DATE_TRUNC('month', NOW())) AS registros_mes,
      COALESCE(SUM(valor_total) FILTER (WHERE data >= DATE_TRUNC('month', NOW())), 0) AS valor_mes
    FROM perdas ${where}
  `, params);
  return rows[0];
}

async function topProdutosPerdidos(limite = 5, secao = null) {
  const params      = [limite];
  const secaoFiltro = secao ? `AND p.secao = $${params.push(secao)}` : '';
  const { rows } = await db.query(
    `SELECT
       pr.id   AS produto_id,
       pr.nome,
       pr.imagem_url,
       SUM(p.quantidade)              AS total_quantidade,
       COALESCE(SUM(p.valor_total),0) AS total_valor,
       COUNT(*)                       AS total_registros
     FROM perdas p
     JOIN produtos pr ON pr.id = p.produto_id
     WHERE p.data >= DATE_TRUNC('month', NOW())
     ${secaoFiltro}
     GROUP BY pr.id, pr.nome, pr.imagem_url
     ORDER BY total_quantidade DESC
     LIMIT $1`,
    params
  );
  return rows;
}

async function perdasPorMotivo(secao = null) {
  const params      = [];
  const secaoFiltro = secao ? `AND p.secao = $${params.push(secao)}` : '';
  const { rows } = await db.query(`
    SELECT
      m.id    AS motivo_id,
      m.nome,
      COUNT(*)                        AS total_registros,
      COALESCE(SUM(p.valor_total), 0) AS total_valor
    FROM perdas p
    JOIN motivos m ON m.id = p.motivo_id
    WHERE p.data >= DATE_TRUNC('month', NOW())
    ${secaoFiltro}
    GROUP BY m.id, m.nome
    ORDER BY total_registros DESC
  `, params);
  return rows;
}

async function recalcularCustos(secao = null) {
  const params = [];
  const secaoFiltro = secao ? `AND p.secao = $${params.push(secao)}` : '';
  const { rowCount } = await db.query(`
    UPDATE perdas p
    SET valor_total = CASE
      WHEN pr.custo IS NOT NULL AND pr.custo > 0 THEN p.quantidade * pr.custo
      ELSE NULL
    END
    FROM produtos pr
    WHERE p.produto_id = pr.id
    ${secaoFiltro}
  `, params);
  return rowCount;
}

module.exports = { criar, listar, excluir, atualizar, recalcularCustos, resumoDashboard, topProdutosPerdidos, perdasPorMotivo };
