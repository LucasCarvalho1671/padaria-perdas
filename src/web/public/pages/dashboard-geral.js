async function renderDashboardGeral(el) {
  el.innerHTML = '<div class="carregando">Carregando dashboard geral...</div>';
  try {
    const [dadosPadaria, dadosAcougue] = await Promise.all([
      fetch('/api/dashboard?secao=padaria').then(r => r.json()),
      fetch('/api/dashboard?secao=acougue').then(r => r.json()),
    ]);

    el.innerHTML = `
      <div class="dg-grid">
        ${_dgColuna(dadosPadaria, 'padaria')}
        ${_dgColuna(dadosAcougue, 'acougue')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}

function _dgColuna(data, secao) {
  const { resumo, topProdutos, porMotivo } = data;
  const isPadaria = secao === 'padaria';
  const icone     = isPadaria ? '🍞' : '🥩';
  const label     = isPadaria ? 'Padaria' : 'Açougue';
  const dashPath  = isPadaria ? '/' : '/acougue';
  const histPath  = isPadaria ? '/historico' : '/acougue/historico';

  // Datas úteis
  const hoje        = new Date().toISOString().split('T')[0];
  const inicioMes   = hoje.slice(0, 8) + '01';
  const fimMes      = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                        .toISOString().split('T')[0];
  const d7 = new Date(); d7.setDate(d7.getDate() - 6);
  const inicioSem   = d7.toISOString().split('T')[0];

  const moeda = v => v == null ? '—'
    : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmt   = v => v == null ? '—'
    : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

  // ── 4 mini-cards de resumo ────────────────────────────────
  const miniCards = [
    {
      titulo:  'Perdas no mês',
      valor:   resumo.registros_mes,
      sub:     'registros',
      filtros: `{dataInicio:'${inicioMes}',dataFim:'${fimMes}'}`,
    },
    {
      titulo:  'Valor (mês)',
      valor:   moeda(resumo.valor_mes),
      sub:     'calculado',
      filtros: `{dataInicio:'${inicioMes}',dataFim:'${fimMes}'}`,
    },
    {
      titulo:  'Semana',
      valor:   resumo.registros_semana,
      sub:     moeda(resumo.valor_semana),
      filtros: `{dataInicio:'${inicioSem}',dataFim:'${hoje}'}`,
    },
    {
      titulo:  'Total',
      valor:   resumo.total_registros,
      sub:     'histórico',
      filtros: `{}`,
    },
  ].map(c => `
    <div class="dg-card" onclick="_dgIrHistorico(${c.filtros},'${secao}')">
      <button class="dg-icon-btn"
        onclick="event.stopPropagation();navegar('${dashPath}')"
        title="Ver dashboard ${label}">${icone}</button>
      <div class="dg-label">${c.titulo}</div>
      <div class="dg-valor">${c.valor}</div>
      <div class="dg-sub">${c.sub}</div>
    </div>
  `).join('');

  // ── Tabela top produtos ───────────────────────────────────
  const tabelaTop = topProdutos.length === 0
    ? `<div class="vazio" style="font-size:.75rem;padding:.6rem 0">Sem perdas</div>`
    : `<table>
        <thead><tr>
          <th>Produto</th><th>Qtd</th><th class="dg-col-valor">R$</th>
        </tr></thead>
        <tbody>
          ${topProdutos.map(p => `
            <tr class="linha-clicavel"
                onclick="_dgIrHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}',produto_id:'${p.produto_id}'},'${secao}')">
              <td class="dg-td-nome">${p.nome}</td>
              <td>${fmt(p.total_quantidade)}</td>
              <td class="dg-col-valor">${moeda(p.total_valor)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

  // ── Tabela por motivo ─────────────────────────────────────
  const tabelaMotivo = porMotivo.length === 0
    ? `<div class="vazio" style="font-size:.75rem;padding:.6rem 0">Sem perdas</div>`
    : `<table>
        <thead><tr>
          <th>Motivo</th><th>Qtd</th><th class="dg-col-valor">R$</th>
        </tr></thead>
        <tbody>
          ${porMotivo.map(m => `
            <tr class="linha-clicavel"
                onclick="_dgIrHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}',motivo_id:'${m.motivo_id}'},'${secao}')">
              <td class="dg-td-nome">${m.nome}</td>
              <td>${m.total_registros}</td>
              <td class="dg-col-valor">${moeda(m.total_valor)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

  return `
    <div class="dg-coluna">
      <div class="dg-coluna-header" onclick="navegar('${dashPath}')">
        ${icone} ${label}
      </div>
      <div class="dg-mini-grid">${miniCards}</div>
      <div class="dg-table-card">
        <div class="dg-table-titulo">Mais perdidos (mês)</div>
        ${tabelaTop}
      </div>
      <div class="dg-table-card">
        <div class="dg-table-titulo">Por motivo (mês)</div>
        ${tabelaMotivo}
      </div>
    </div>
  `;
}

function _dgIrHistorico(filtros, secao) {
  window._historicoFiltros = filtros;
  navegar(secao === 'acougue' ? '/acougue/historico' : '/historico');
}
