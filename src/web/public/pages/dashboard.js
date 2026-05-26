async function renderDashboard(el) {
  el.innerHTML = '<div class="carregando">Carregando dashboard...</div>';
  try {
    const res  = await fetch('/api/dashboard');
    const data = await res.json();
    const { resumo, topProdutos, porMotivo, comparativo } = data;

    const fmt = (v) => v == null ? '—' :
      Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const moeda = (v) => v == null ? '—' :
      'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    el.innerHTML = `
      <!-- Resumo rápido -->
      <div class="grid-resumo">
        <div class="card-resumo">
          <div class="label">Perdas no mês</div>
          <div class="valor">${resumo.registros_mes}</div>
          <div class="sub">registros</div>
        </div>
        <div class="card-resumo">
          <div class="label">Valor perdido (mês)</div>
          <div class="valor" style="font-size:1.2rem">${moeda(resumo.valor_mes)}</div>
          <div class="sub">calculado</div>
        </div>
        <div class="card-resumo">
          <div class="label">Perdas na semana</div>
          <div class="valor">${resumo.registros_semana}</div>
          <div class="sub">${moeda(resumo.valor_semana)}</div>
        </div>
        <div class="card-resumo">
          <div class="label">Total histórico</div>
          <div class="valor">${resumo.total_registros}</div>
          <div class="sub">registros</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Top produtos com mais perda -->
        <div class="card">
          <div class="secao-titulo">🥖 Mais perdidos este mês</div>
          ${topProdutos.length === 0
            ? '<div class="vazio">Nenhuma perda registrada.</div>'
            : `<table>
                <thead><tr><th>Produto</th><th>Qtd</th><th>Valor</th></tr></thead>
                <tbody>
                  ${topProdutos.map(p => `
                    <tr>
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
                    <tr>
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
                    <tr>
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
