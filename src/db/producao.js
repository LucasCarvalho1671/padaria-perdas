const db = require('./index');

async function criar({ produto_id, quantidade, data, observacao, usuario_id }) {
  const { rows } = await db.query(
    `INSERT INTO producao (produto_id, quantidade, data, observacao, usuario_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [produto_id, quantidade, data, observacao || null, usuario_id]
  );
  return rows[0];
}

async function listar({ dataInicio, dataFim, produto_id } = {}) {
  const filtros = ['1=1'];
  const params = [];

  if (dataInicio) { params.push(dataInicio); filtros.push(`p.data >= $${params.length}`); }
  if (dataFim)    { params.push(dataFim);    filtros.push(`p.data <= $${params.length}`); }
  if (produto_id) { params.push(produto_id); filtros.push(`p.produto_id = $${params.length}`); }

  const { rows } = await db.query(
    `SELECT
       p.*,
       pr.nome  AS produto_nome,
       pr.unidade,
       pr.imagem_url,
       u.nome   AS usuario_nome
     FROM producao p
     JOIN produtos pr ON pr.id = p.produto_id
     JOIN usuarios u  ON u.id  = p.usuario_id
     WHERE ${filtros.join(' AND ')}
     ORDER BY p.data DESC, p.criado_em DESC`,
    params
  );
  return rows;
}

async function excluir(id) {
  await db.query(`DELETE FROM producao WHERE id = $1`, [id]);
}

// Comparativo de produção x perda por produto (no mês atual)
async function comparativo() {
  const { rows } = await db.query(`
    SELECT
      pr.id,
      pr.nome,
      pr.unidade,
      pr.imagem_url,
      COALESCE(SUM(prod.quantidade), 0) AS total_produzido,
      COALESCE(SUM(perd.quantidade), 0) AS total_perdido,
      CASE
        WHEN COALESCE(SUM(prod.quantidade), 0) = 0 THEN NULL
        ELSE ROUND(
          COALESCE(SUM(perd.quantidade), 0) * 100.0 / SUM(prod.quantidade), 2
        )
      END AS percentual_perda
    FROM produtos pr
    LEFT JOIN producao prod
      ON prod.produto_id = pr.id
      AND prod.data >= DATE_TRUNC('month', NOW())
    LEFT JOIN perdas perd
      ON perd.produto_id = pr.id
      AND perd.data >= DATE_TRUNC('month', NOW())
    WHERE pr.ativo = TRUE
    GROUP BY pr.id, pr.nome, pr.unidade, pr.imagem_url
    HAVING COALESCE(SUM(prod.quantidade), 0) > 0
        OR COALESCE(SUM(perd.quantidade), 0) > 0
    ORDER BY percentual_perda DESC NULLS LAST
  `);
  return rows;
}

module.exports = { criar, listar, excluir, comparativo };
