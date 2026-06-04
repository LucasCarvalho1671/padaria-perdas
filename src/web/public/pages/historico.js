async function renderHistorico(el, secao = 'padaria') {
  el.dataset.secao = secao;
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [produtos, motivos, funcionarios] = await Promise.all([
      fetch(`/api/produtos?secao=${secao}`).then(r => r.json()),
      fetch(`/api/motivos?secao=${secao}`).then(r => r.json()),
      fetch(`/api/funcionarios?secao=${secao}`).then(r => r.json()),
    ]);

    // Armazena para uso no modal de edição
    window._historicoData = { produtos, motivos, funcionarios, secao };

    el.innerHTML = `
      <!-- ── Modal detalhe de perda ── -->
      <div id="modal-detalhe-perda" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:490;align-items:center;justify-content:center;padding:1rem">
        <div class="card" style="width:100%;max-width:480px;margin:0;max-height:90vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;padding-bottom:.6rem;border-bottom:2px solid var(--cor-primaria)">
            <span style="font-weight:700;color:var(--cor-primaria);font-size:1rem">📋 Detalhes da perda</span>
            <button onclick="fecharDetalhePerda()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:#999;line-height:1">✕</button>
          </div>
          <div id="dp-conteudo"></div>
          <div id="dp-acoes" style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--cor-borda)"></div>
        </div>
      </div>

      <!-- ── Modal edição de perda ── -->
      <div id="modal-editar-perda" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:460px;margin:1rem;max-height:90vh;overflow-y:auto">
          <div class="secao-titulo">✏️ Editar registro de perda</div>
          <div id="alerta-edit-perda"></div>
          <form id="form-editar-perda">
            <input type="hidden" id="ep-id" />
            <div class="campo">
              <label>Produto *</label>
              <select id="ep-produto" required>
                ${produtos.map(p => `<option value="${p.id}">${p.nome} (${p.unidade})</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Motivo *</label>
              <select id="ep-motivo" required>
                ${motivos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Quantidade *</label>
              <input type="number" id="ep-quantidade" min="0.001" step="0.001" required />
            </div>
            <div class="campo">
              <label>Data *</label>
              <input type="date" id="ep-data" required />
            </div>
            <div class="campo">
              <label>Observação</label>
              <textarea id="ep-obs" placeholder="Opcional..."></textarea>
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-ep">Salvar</button>
              <button type="button" class="btn btn-secundario" onclick="fecharModalEdicaoPerda()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="filtros">
        <div class="campo">
          <label>De</label>
          <input type="date" id="h-inicio" />
        </div>
        <div class="campo">
          <label>Até</label>
          <input type="date" id="h-fim" />
        </div>
        <div class="campo">
          <label>Produto</label>
          ${htmlCombobox('h-produto', 'Todos os produtos', [
            { value: '', label: 'Todos os produtos' },
            ...(produtos.some(p => p.favorito) ? [{ disabled: true }] : []),
            ...produtos.filter(p => p.favorito).map(p => ({ value: p.id, label: `★ ${p.nome}` })),
            ...(produtos.some(p => p.favorito) && produtos.some(p => !p.favorito) ? [{ disabled: true }] : []),
            ...produtos.filter(p => !p.favorito).map(p => ({ value: p.id, label: p.nome })),
          ])}
        </div>
        <div class="campo">
          <label>Motivo</label>
          <select id="h-motivo">
            <option value="">Todos</option>
            ${motivos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Cobrado de</label>
          <select id="h-funcionario">
            <option value="">Todos</option>
            <option value="__com_cobranca__">⚠️ Apenas com cobrança</option>
            ${funcionarios.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primario" id="btn-buscar">Buscar</button>
        ${temPermissao('exportar_relatorio') ? `<button class="btn btn-secundario" id="btn-exportar">⬇ Exportar Excel</button>` : ''}
      </div>

      <div class="card">
        <div class="secao-titulo">📂 Histórico de perdas</div>
        <div id="lista-historico" class="tabela-wrapper">
          <div class="vazio">Selecione os filtros e clique em Buscar.</div>
        </div>
      </div>
    `;

    ativarComboboxes();

    // ── Pré-preenche filtros vindos do dashboard ──────────────
    const filtrosIniciais = window._historicoFiltros || null;
    window._historicoFiltros = null; // consome e limpa

    if (filtrosIniciais) {
      if (filtrosIniciais.dataInicio)
        document.getElementById('h-inicio').value = filtrosIniciais.dataInicio;
      if (filtrosIniciais.dataFim)
        document.getElementById('h-fim').value = filtrosIniciais.dataFim;
      if (filtrosIniciais.motivo_id)
        document.getElementById('h-motivo').value = filtrosIniciais.motivo_id;
      if (filtrosIniciais.produto_id) {
        // Preenche o combobox: hidden value + texto visível
        const hidden = document.getElementById('h-produto');
        if (hidden) hidden.value = filtrosIniciais.produto_id;
        const wrap   = document.querySelector('.combo-wrap[data-hidden="h-produto"]');
        const opcao  = wrap?.querySelector(`.combo-opcao[data-value="${filtrosIniciais.produto_id}"]`);
        const input  = wrap?.querySelector('.combo-input');
        if (input && opcao) input.value = opcao.textContent.trim();
      }
    }

    const buscar = async () => {
      const params = new URLSearchParams({ secao });
      const ini  = document.getElementById('h-inicio').value;
      const fim  = document.getElementById('h-fim').value;
      const prod = document.getElementById('h-produto').value;
      const mot  = document.getElementById('h-motivo').value;
      const func = document.getElementById('h-funcionario').value;
      if (ini)  params.append('dataInicio', ini);
      if (fim)  params.append('dataFim',    fim);
      if (prod) params.append('produto_id', prod);
      if (mot)  params.append('motivo_id',  mot);
      if (func === '__com_cobranca__') params.append('apenas_com_cobranca', '1');
      else if (func) params.append('funcionario_cobrado_id', func);

      const lista = document.getElementById('lista-historico');
      lista.innerHTML = '<div class="carregando">Buscando...</div>';

      const perdas = await fetch('/api/perdas?' + params).then(r => r.json());

      // Armazena para o modal de edição
      window._historicoRegistros = perdas;

      if (perdas.length === 0) {
        lista.innerHTML = '<div class="vazio">Nenhuma perda encontrada.</div>';
        return;
      }

      const fmt   = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 3 });
      const moeda = v => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const fmtData = d => {
        if (!d) return '—';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      };

      // ── Totalizador por unidade de medida ──────────────────
      const totaisPorUnidade = {};
      let totalValor = 0;
      perdas.forEach(p => {
        const un = p.unidade || 'un';
        totaisPorUnidade[un] = (totaisPorUnidade[un] || 0) + Number(p.quantidade);
        if (p.valor_total) totalValor += Number(p.valor_total);
      });

      const chipsUnidade = Object.entries(totaisPorUnidade)
        .map(([un, qtd]) =>
          `<span class="total-chip">${qtd.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${un}</span>`)
        .join('<span class="total-sep">·</span>');

      const chipValor = totalValor > 0
        ? `<span class="total-sep">·</span><span class="total-chip total-chip--valor">R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`
        : '';

      let totalCobrado = 0;
      perdas.forEach(p => { if (p.valor_cobrado) totalCobrado += Number(p.valor_cobrado); });
      const chipCobrado = totalCobrado > 0
        ? `<span class="total-sep">·</span><span class="total-chip total-chip--cobrado">⚠️ cobrado R$ ${totalCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`
        : '';

      lista.innerHTML = `
        <div class="totalizador">
          <span class="total-label">${perdas.length} registro${perdas.length !== 1 ? 's' : ''}</span>
          <span class="total-sep">·</span>
          ${chipsUnidade}
          ${chipValor}
          ${chipCobrado}
        </div>
        <table>
          <thead><tr>
            <th>Data</th><th>Produto</th><th>Qtd</th><th>Valor</th><th>Motivo</th><th></th>
          </tr></thead>
          <tbody>
            ${perdas.map(p => `
              <tr class="linha-clicavel" onclick="abrirDetalhePerda(${p.id})">
                <td>${fmtData(p.data)}</td>
                <td>
                  ${p.imagem_url ? `<img src="${p.imagem_url}" class="produto-thumb" />` : ''}
                  ${p.produto_nome}
                </td>
                <td>${fmt(p.quantidade)} ${p.unidade}</td>
                <td>${moeda(p.valor_total)}</td>
                <td>
                  ${p.motivo_nome}
                  ${p.funcionario_cobrado_nome ? `<span class="badge badge-vermelho" style="font-size:.65rem;margin-left:.3rem">⚠️</span>` : ''}
                </td>
                <td style="white-space:nowrap">
                  ${temPermissao('editar_perda')
                    ? `<button class="btn btn-secundario btn-sm" onclick="event.stopPropagation();abrirEdicaoPerda(${p.id})">✏️</button>`
                    : ''}
                  ${temPermissao('excluir_perda')
                    ? `<button class="btn btn-perigo btn-sm" onclick="event.stopPropagation();excluirPerda(${p.id})">✕</button>`
                    : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    };

    document.getElementById('btn-buscar').onclick = buscar;

    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
      btnExportar.onclick = () => {
        const params = new URLSearchParams({ secao });
        const ini = document.getElementById('h-inicio').value;
        const fim = document.getElementById('h-fim').value;
        if (ini) params.append('dataInicio', ini);
        if (fim) params.append('dataFim',    fim);
        window.location.href = '/api/relatorio/exportar?' + params;
      };
    }

    // ── Salvar edição de perda ────────────────────────────────
    document.getElementById('form-editar-perda').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-ep');
      const alerta = document.getElementById('alerta-edit-perda');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      try {
        const id      = document.getElementById('ep-id').value;
        // Preserva dados de cobrança do registro original
        const original = (window._historicoRegistros || []).find(x => x.id == id);
        const res = await fetch(`/api/perdas/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id:             document.getElementById('ep-produto').value,
            motivo_id:              document.getElementById('ep-motivo').value,
            quantidade:             document.getElementById('ep-quantidade').value,
            data:                   document.getElementById('ep-data').value,
            observacao:             document.getElementById('ep-obs').value,
            funcionario_cobrado_id: original?.funcionario_cobrado_id || null,
            valor_cobrado:          original?.valor_cobrado || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        fecharModalEdicaoPerda();
        buscar();
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });

    // Carrega automaticamente (filtros pré-preenchidos ou padrão)
    buscar();

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}

// ── Abrir/fechar modal de edição de perda ─────────────────────
function abrirEdicaoPerda(id) {
  const p = (window._historicoRegistros || []).find(x => x.id === id);
  if (!p) return;

  document.getElementById('ep-id').value       = p.id;
  document.getElementById('ep-produto').value  = p.produto_id;
  document.getElementById('ep-motivo').value   = p.motivo_id;
  document.getElementById('ep-quantidade').value = Number(p.quantidade);
  // data vem como "2025-01-15T00:00:00.000Z" — pega só YYYY-MM-DD
  document.getElementById('ep-data').value     = (p.data || '').slice(0, 10);
  document.getElementById('ep-obs').value      = p.observacao || '';
  document.getElementById('alerta-edit-perda').innerHTML = '';
  document.getElementById('btn-salvar-ep').disabled    = false;
  document.getElementById('btn-salvar-ep').textContent = 'Salvar';

  document.getElementById('modal-editar-perda').style.display = 'flex';
}

function fecharModalEdicaoPerda() {
  document.getElementById('modal-editar-perda').style.display = 'none';
}

async function excluirPerda(id) {
  const ok = await confirmar('Excluir este registro de perda?', { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' });
  if (!ok) return;
  try {
    await fetch(`/api/perdas/${id}`, { method: 'DELETE' });
    const el = document.getElementById('conteudo');
    renderHistorico(el, el.dataset.secao || 'padaria');
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}

// ── Modal de detalhe de perda ─────────────────────────────────
function abrirDetalhePerda(id) {
  const p = (window._historicoRegistros || []).find(x => x.id === id);
  if (!p) return;

  const fmtData = d => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' });
  };
  const moeda = v => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmt   = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

  document.getElementById('dp-conteudo').innerHTML = `
    ${p.imagem_url ? `<img src="${p.imagem_url}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin-bottom:1rem" />` : ''}
    <div class="dp-grid">
      <div class="dp-item">
        <div class="dp-label">📅 Data</div>
        <div class="dp-valor">${fmtData(p.data)}</div>
      </div>
      <div class="dp-item">
        <div class="dp-label">📦 Produto</div>
        <div class="dp-valor">${p.produto_nome}</div>
      </div>
      <div class="dp-item">
        <div class="dp-label">📏 Quantidade</div>
        <div class="dp-valor">${fmt(p.quantidade)} ${p.unidade}</div>
      </div>
      <div class="dp-item">
        <div class="dp-label">💰 Valor perdido</div>
        <div class="dp-valor">${moeda(p.valor_total)}</div>
      </div>
      <div class="dp-item">
        <div class="dp-label">📌 Motivo</div>
        <div class="dp-valor">${p.motivo_nome}</div>
      </div>
      <div class="dp-item">
        <div class="dp-label">👤 Registrado por</div>
        <div class="dp-valor">${p.usuario_nome}</div>
      </div>
    </div>

    ${p.funcionario_cobrado_nome ? `
    <div class="dp-cobranca">
      <div style="font-weight:700;color:var(--cor-erro);margin-bottom:.6rem">⚠️ Cobrança por negligência</div>
      <div class="dp-grid" style="margin-bottom:0">
        <div class="dp-item">
          <div class="dp-label">👷 Funcionário</div>
          <div class="dp-valor">${p.funcionario_cobrado_nome}</div>
        </div>
        <div class="dp-item">
          <div class="dp-label">💸 Valor cobrado</div>
          <div class="dp-valor">${moeda(p.valor_cobrado)}</div>
        </div>
      </div>
    </div>` : ''}

    ${p.observacao ? `
    <div style="margin-top:.75rem">
      <div class="dp-label" style="font-size:.72rem;color:var(--cor-texto-sub);text-transform:uppercase;letter-spacing:.03em;margin-bottom:.3rem">📝 Observação</div>
      <div class="dp-obs">${p.observacao}</div>
    </div>` : ''}
  `;

  document.getElementById('dp-acoes').innerHTML = `
    ${temPermissao('editar_perda')
      ? `<button class="btn btn-secundario" onclick="fecharDetalhePerda();abrirEdicaoPerda(${p.id})">✏️ Editar</button>`
      : ''}
    ${temPermissao('excluir_perda')
      ? `<button class="btn btn-perigo" onclick="fecharDetalhePerda();excluirPerda(${p.id})">🗑️ Excluir</button>`
      : ''}
    <button class="btn btn-secundario" onclick="fecharDetalhePerda()" style="margin-left:auto">Fechar</button>
  `;

  document.getElementById('modal-detalhe-perda').style.display = 'flex';
}

function fecharDetalhePerda() {
  document.getElementById('modal-detalhe-perda').style.display = 'none';
}
