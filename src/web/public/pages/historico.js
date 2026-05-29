async function renderHistorico(el, secao = 'padaria') {
  el.dataset.secao = secao;
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [produtos, motivos] = await Promise.all([
      fetch(`/api/produtos?secao=${secao}`).then(r => r.json()),
      fetch(`/api/motivos?secao=${secao}`).then(r => r.json()),
    ]);

    // Armazena para uso no modal de edição
    window._historicoData = { produtos, motivos, secao };

    el.innerHTML = `
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
      if (ini)  params.append('dataInicio', ini);
      if (fim)  params.append('dataFim',    fim);
      if (prod) params.append('produto_id', prod);
      if (mot)  params.append('motivo_id',  mot);

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

      lista.innerHTML = `
        <div class="totalizador">
          <span class="total-label">${perdas.length} registro${perdas.length !== 1 ? 's' : ''}</span>
          <span class="total-sep">·</span>
          ${chipsUnidade}
          ${chipValor}
        </div>
        <table>
          <thead><tr>
            <th>Data</th><th>Produto</th><th>Qtd</th><th>Valor</th><th>Motivo</th><th>Obs.</th><th>Por</th><th></th>
          </tr></thead>
          <tbody>
            ${perdas.map(p => `
              <tr>
                <td>${fmtData(p.data)}</td>
                <td>
                  ${p.imagem_url ? `<img src="${p.imagem_url}" class="produto-thumb" />` : ''}
                  ${p.produto_nome}
                </td>
                <td>${fmt(p.quantidade)} ${p.unidade}</td>
                <td>${moeda(p.valor_total)}</td>
                <td>${p.motivo_nome}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.observacao || '—'}</td>
                <td>${p.usuario_nome}</td>
                <td style="white-space:nowrap">
                  ${temPermissao('editar_perda')
                    ? `<button class="btn btn-secundario btn-sm" onclick="abrirEdicaoPerda(${p.id})">✏️</button>`
                    : ''}
                  ${temPermissao('excluir_perda')
                    ? `<button class="btn btn-perigo btn-sm" onclick="excluirPerda(${p.id})">✕</button>`
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
        const id  = document.getElementById('ep-id').value;
        const res = await fetch(`/api/perdas/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id: document.getElementById('ep-produto').value,
            motivo_id:  document.getElementById('ep-motivo').value,
            quantidade: document.getElementById('ep-quantidade').value,
            data:       document.getElementById('ep-data').value,
            observacao: document.getElementById('ep-obs').value,
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
