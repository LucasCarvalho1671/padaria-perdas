async function renderDashboard(el, secao = 'padaria') {
  el.innerHTML = '<div class="carregando">Carregando dashboard...</div>';
  try {
    const res  = await fetch(`/api/dashboard?secao=${secao}`);
    const data = await res.json();
    const { resumo, topProdutos, porMotivo, comparativo } = data;

    const fmt = (v) => v == null ? '—' :
      Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const moeda = (v) => v == null ? '—' :
      'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // ── Datas úteis para os filtros ───────────────────────────
    const hoje         = new Date().toISOString().split('T')[0];
    const inicioMes    = hoje.slice(0, 8) + '01';
    const fimMes       = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                           .toISOString().split('T')[0];
    const d7 = new Date(); d7.setDate(d7.getDate() - 6);
    const inicioSemana = d7.toISOString().split('T')[0];

    el.innerHTML = `
      <!-- ── Resumo rápido ── -->
      <div class="grid-resumo">
        <div class="card-resumo card-resumo-link"
             onclick="irParaHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}'},'${secao}')"
             title="Ver perdas do mês no histórico">
          <div class="label">Perdas no mês</div>
          <div class="valor">${resumo.registros_mes}</div>
          <div class="sub">registros · ver detalhes →</div>
        </div>
        <div class="card-resumo card-resumo-link"
             onclick="irParaHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}'},'${secao}')"
             title="Ver perdas do mês no histórico">
          <div class="label">Valor perdido (mês)</div>
          <div class="valor">${moeda(resumo.valor_mes)}</div>
          <div class="sub">calculado · ver detalhes →</div>
        </div>
        <div class="card-resumo card-resumo-link"
             onclick="irParaHistorico({dataInicio:'${inicioSemana}',dataFim:'${hoje}'},'${secao}')"
             title="Ver perdas dos últimos 7 dias no histórico">
          <div class="label">Perdas na semana</div>
          <div class="valor">${resumo.registros_semana}</div>
          <div class="sub">${moeda(resumo.valor_semana)} · ver detalhes →</div>
        </div>
        <div class="card-resumo card-resumo-link"
             onclick="irParaHistorico({},'${secao}')"
             title="Ver todo o histórico de perdas">
          <div class="label">Total histórico</div>
          <div class="valor">${resumo.total_registros}</div>
          <div class="sub">registros · ver todos →</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Top produtos com mais perda -->
        <div class="card">
          <div class="secao-titulo">${secao === 'acougue' ? '🥩' : '🥖'} Mais perdidos este mês</div>
          ${topProdutos.length === 0
            ? '<div class="vazio">Nenhuma perda registrada.</div>'
            : `<table>
                <thead><tr><th>Produto</th><th>Qtd</th><th>Valor</th></tr></thead>
                <tbody>
                  ${topProdutos.map(p => `
                    <tr class="linha-clicavel"
                        onclick="irParaHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}',produto_id:'${p.produto_id}'},'${secao}')"
                        title="Ver perdas deste produto no mês">
                      <td>
                        ${p.imagem_url ? `<img src="${p.imagem_url}" class="produto-thumb" />` : ''}
                        ${p.nome}
                      </td>
                      <td>${fmt(p.total_quantidade)}</td>
                      <td>${moeda(p.total_valor)}</td>
                    </tr>`).join('')}
                </tbody>
               </table>`}
        </div>

        <!-- Perdas por motivo -->
        <div class="card">
          <div class="secao-titulo">📌 Por motivo (mês)</div>
          ${porMotivo.length === 0
            ? '<div class="vazio">Nenhuma perda registrada.</div>'
            : `<table>
                <thead><tr><th>Motivo</th><th>Qtd</th><th>Valor</th></tr></thead>
                <tbody>
                  ${porMotivo.map(m => `
                    <tr class="linha-clicavel"
                        onclick="irParaHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}',motivo_id:'${m.motivo_id}'},'${secao}')"
                        title="Ver perdas deste motivo no mês">
                      <td>${m.nome}</td>
                      <td>${m.total_registros}</td>
                      <td>${moeda(m.total_valor)}</td>
                    </tr>`).join('')}
                </tbody>
               </table>`}
        </div>
      </div>

      <!-- Comparativo produção x perda -->
      <div class="card">
        <div class="secao-titulo">📊 Produção × Perda (mês atual)</div>
        ${comparativo.length === 0
          ? '<div class="vazio">Nenhum dado de produção ou perda registrado.</div>'
          : `<div class="tabela-wrapper">
              <table>
                <thead><tr>
                  <th>Produto</th><th>Produzido</th><th>Perdido</th><th>% Perda</th>
                </tr></thead>
                <tbody>
                  ${comparativo.map(c => `
                    <tr class="linha-clicavel"
                        onclick="irParaHistorico({dataInicio:'${inicioMes}',dataFim:'${fimMes}',produto_id:'${c.id}'},'${secao}')"
                        title="Ver histórico de perdas deste produto no mês">
                      <td>
                        ${c.imagem_url ? `<img src="${c.imagem_url}" class="produto-thumb" />` : ''}
                        ${c.nome} <small style="color:#999">(${c.unidade})</small>
                      </td>
                      <td>${fmt(c.total_produzido)}</td>
                      <td>${fmt(c.total_perdido)}</td>
                      <td>
                        ${c.percentual_perda != null
                          ? `<span class="badge ${c.percentual_perda > 20 ? 'badge-vermelho' : c.percentual_perda > 10 ? 'badge-cinza' : 'badge-verde'}">
                              ${c.percentual_perda}%
                            </span>`
                          : '—'}
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
             </div>`}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro ao carregar dashboard: ${err.message}</div>`;
  }
}

// ── Navega para o histórico com filtros pré-aplicados ─────────
function irParaHistorico(filtros, secao) {
  window._historicoFiltros = filtros;
  navegar(secao === 'acougue' ? '/acougue/historico' : '/historico');
}
