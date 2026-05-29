async function renderProducao(el, secao = 'padaria') {
  el.dataset.secao = secao;
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const produtos = await fetch(`/api/produtos?secao=${secao}`).then(r => r.json());

    // Mapa rápido: id → produto completo
    const mapaProdutos = {};
    produtos.forEach(p => { mapaProdutos[p.id] = p; });

    const hoje = new Date().toISOString().split('T')[0];

    // Armazena para uso no modal de edição
    window._producaoData = { produtos, secao };

    el.innerHTML = `
      <!-- ── Modal edição de produção ── -->
      <div id="modal-editar-producao" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:440px;margin:1rem;max-height:90vh;overflow-y:auto">
          <div class="secao-titulo">✏️ Editar registro de produção</div>
          <div id="alerta-edit-producao"></div>
          <form id="form-editar-producao">
            <input type="hidden" id="epr-id" />
            <div class="campo">
              <label>Produto *</label>
              <select id="epr-produto" required>
                ${produtos.map(p => `<option value="${p.id}">${p.nome} (${p.unidade})</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Quantidade *</label>
              <input type="number" id="epr-quantidade" min="0.001" step="0.001" required />
            </div>
            <div class="campo">
              <label>Data *</label>
              <input type="date" id="epr-data" required />
            </div>
            <div class="campo">
              <label>Observação</label>
              <textarea id="epr-obs" placeholder="Opcional..."></textarea>
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-epr">Salvar</button>
              <button type="button" class="btn btn-secundario" onclick="fecharModalEdicaoProducao()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Formulário + preview ── -->
      <div class="perda-layout" style="margin-bottom:1.5rem">

        <div class="card">
          <div class="secao-titulo">🏭 Registrar produção</div>
          <div id="alerta-prod"></div>
          <form id="form-prod">
            <div class="campo">
              <label>Produto *</label>
              ${htmlCombobox('pr-produto', 'Digite para pesquisar...', [
                ...produtos.filter(p => p.favorito).map(p => ({ value: p.id, label: `★ ${p.nome} (${p.unidade})` })),
                ...(produtos.some(p => p.favorito) && produtos.some(p => !p.favorito) ? [{ disabled: true }] : []),
                ...produtos.filter(p => !p.favorito).map(p => ({ value: p.id, label: `${p.nome} (${p.unidade})` })),
              ])}
            </div>
            <div class="campo">
              <label>Quantidade produzida *</label>
              <input type="number" id="pr-quantidade" min="0.001" step="0.001" placeholder="Ex: 100" required />
            </div>
            <div class="campo">
              <label>Data *</label>
              <input type="date" id="pr-data" required value="${hoje}" />
            </div>
            <div class="campo">
              <label>Observação</label>
              <textarea id="pr-obs" placeholder="Opcional..."></textarea>
            </div>
            <button type="submit" class="btn btn-primario btn-block" id="btn-salvar-prod">
              Registrar Produção
            </button>
          </form>
        </div>

        <!-- Preview do produto -->
        <div class="card perda-preview" id="preview-produto-prod">
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📦</span>
            <span>Selecione um produto<br>para ver a imagem</span>
          </div>
        </div>

      </div>

      <!-- ── Histórico de produção ── -->
      <div class="card">
        <div class="secao-titulo">📋 Histórico de produção</div>

        <div class="filtros" style="margin-bottom:1rem">
          <div class="campo">
            <label>De</label>
            <input type="date" id="hp-inicio" />
          </div>
          <div class="campo">
            <label>Até</label>
            <input type="date" id="hp-fim" />
          </div>
          <div class="campo">
            <label>Produto</label>
            ${htmlCombobox('hp-produto', 'Todos os produtos', [
              { value: '', label: 'Todos os produtos' },
              ...(produtos.some(p => p.favorito) ? [{ disabled: true }] : []),
              ...produtos.filter(p => p.favorito).map(p => ({ value: p.id, label: `★ ${p.nome}` })),
              ...(produtos.some(p => p.favorito) && produtos.some(p => !p.favorito) ? [{ disabled: true }] : []),
              ...produtos.filter(p => !p.favorito).map(p => ({ value: p.id, label: p.nome })),
            ])}
          </div>
          <button class="btn btn-primario" id="btn-buscar-prod">Buscar</button>
          ${temPermissao('exportar_relatorio') ? `<button class="btn btn-secundario" id="btn-exportar-prod">⬇ Exportar Excel</button>` : ''}
        </div>

        <div id="lista-producao" class="tabela-wrapper">
          <div class="carregando">Carregando...</div>
        </div>
      </div>
    `;

    ativarComboboxes();

    // ── Atualiza preview ao trocar o produto ─────────────────
    document.getElementById('pr-produto').addEventListener('change', (e) => {
      const preview = document.getElementById('preview-produto-prod');
      const produto = mapaProdutos[e.target.value];

      if (!produto) {
        preview.innerHTML = `
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📦</span>
            <span>Selecione um produto<br>para ver a imagem</span>
          </div>`;
        return;
      }

      if (produto.imagem_url) {
        preview.innerHTML = `
          <img src="${produto.imagem_url}" class="perda-preview-img"
               onerror="this.parentElement.innerHTML='<div class=\\'perda-preview-vazio\\'><span class=\\'perda-preview-icon\\'>📷</span><span>Sem imagem cadastrada</span></div>'" />
          <div class="perda-preview-nome">${produto.nome}</div>
          <div class="perda-preview-unidade">${produto.unidade}</div>`;
      } else {
        preview.innerHTML = `
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📷</span>
            <span>Sem imagem cadastrada<br>para este produto</span>
          </div>
          <div class="perda-preview-nome">${produto.nome}</div>`;
      }
    });

    // ── Carrega histórico de produção ─────────────────────────
    const carregarHistorico = async () => {
      const lista = document.getElementById('lista-producao');
      lista.innerHTML = '<div class="carregando">Buscando...</div>';

      const params = new URLSearchParams({ secao });
      const ini  = document.getElementById('hp-inicio').value;
      const fim  = document.getElementById('hp-fim').value;
      const prod = document.getElementById('hp-produto').value;
      if (ini)  params.append('dataInicio', ini);
      if (fim)  params.append('dataFim',    fim);
      if (prod) params.append('produto_id', prod);

      const registros = await fetch('/api/producao?' + params).then(r => r.json());

      // Armazena para o modal de edição
      window._producaoRegistros = registros;

      if (!registros.length) {
        lista.innerHTML = '<div class="vazio">Nenhum registro encontrado.</div>';
        return;
      }

      const fmtQtd  = v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
      const fmtData = d => {
        if (!d) return '—';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      };

      lista.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Obs.</th>
              <th>Por</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${registros.map(r => `
              <tr>
                <td>${fmtData(r.data)}</td>
                <td>
                  ${r.imagem_url ? `<img src="${r.imagem_url}" class="produto-thumb" />` : ''}
                  ${r.produto_nome}
                </td>
                <td>${fmtQtd(r.quantidade)} ${r.unidade}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${r.observacao || '—'}
                </td>
                <td>${r.usuario_nome}</td>
                <td style="white-space:nowrap">
                  ${temPermissao('editar_producao')
                    ? `<button class="btn btn-secundario btn-sm" onclick="abrirEdicaoProducao(${r.id})">✏️</button>`
                    : ''}
                  ${temPermissao('excluir_producao')
                    ? `<button class="btn btn-perigo btn-sm" onclick="excluirProducao(${r.id})">✕</button>`
                    : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    };

    document.getElementById('btn-buscar-prod').onclick = carregarHistorico;

    const btnExportarProd = document.getElementById('btn-exportar-prod');
    if (btnExportarProd) {
      btnExportarProd.onclick = () => {
        const params = new URLSearchParams({ tipo: 'producao', secao });
        const ini = document.getElementById('hp-inicio').value;
        const fim = document.getElementById('hp-fim').value;
        if (ini) params.append('dataInicio', ini);
        if (fim) params.append('dataFim',    fim);
        window.location.href = '/api/relatorio/exportar?' + params;
      };
    }

    // ── Registrar produção ────────────────────────────────────
    document.getElementById('form-prod').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-prod');
      const alerta = document.getElementById('alerta-prod');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      if (!document.getElementById('pr-produto').value) {
        alerta.innerHTML = '<div class="alerta alerta-erro">Selecione um produto da lista.</div>';
        btn.disabled = false;
        btn.textContent = 'Registrar Produção';
        return;
      }

      try {
        const res = await fetch('/api/producao', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id: document.getElementById('pr-produto').value,
            quantidade: document.getElementById('pr-quantidade').value,
            data:       document.getElementById('pr-data').value,
            observacao: document.getElementById('pr-obs').value,
            secao,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Produção registrada com sucesso!</div>';
        document.getElementById('form-prod').reset();
        document.getElementById('pr-data').value = hoje;

        // Limpa preview
        document.getElementById('preview-produto-prod').innerHTML = `
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📦</span>
            <span>Selecione um produto<br>para ver a imagem</span>
          </div>`;

        // Atualiza o histórico automaticamente
        await carregarHistorico();

      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Registrar Produção';
      }
    });

    // ── Salvar edição de produção ─────────────────────────────
    document.getElementById('form-editar-producao').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-epr');
      const alerta = document.getElementById('alerta-edit-producao');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      try {
        const id  = document.getElementById('epr-id').value;
        const res = await fetch(`/api/producao/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id: document.getElementById('epr-produto').value,
            quantidade: document.getElementById('epr-quantidade').value,
            data:       document.getElementById('epr-data').value,
            observacao: document.getElementById('epr-obs').value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        fecharModalEdicaoProducao();
        await carregarHistorico();
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });

    // Carrega histórico ao abrir a tela
    await carregarHistorico();

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro ao carregar: ${err.message}</div>`;
  }
}

// ── Abrir/fechar modal de edição de produção ─────────────────
function abrirEdicaoProducao(id) {
  const r = (window._producaoRegistros || []).find(x => x.id === id);
  if (!r) return;

  document.getElementById('epr-id').value        = r.id;
  document.getElementById('epr-produto').value   = r.produto_id;
  document.getElementById('epr-quantidade').value = Number(r.quantidade);
  document.getElementById('epr-data').value      = (r.data || '').slice(0, 10);
  document.getElementById('epr-obs').value       = r.observacao || '';
  document.getElementById('alerta-edit-producao').innerHTML = '';
  document.getElementById('btn-salvar-epr').disabled    = false;
  document.getElementById('btn-salvar-epr').textContent = 'Salvar';

  document.getElementById('modal-editar-producao').style.display = 'flex';
}

function fecharModalEdicaoProducao() {
  document.getElementById('modal-editar-producao').style.display = 'none';
}

async function excluirProducao(id) {
  const ok = await confirmar('Excluir este registro de produção?', { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' });
  if (!ok) return;
  try {
    const res = await fetch(`/api/producao/${id}`, { method: 'DELETE' });
    if (!res.ok) { await alertar('Erro ao excluir.'); return; }
    const el = document.getElementById('conteudo');
    renderProducao(el, el.dataset.secao || 'padaria');
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}
