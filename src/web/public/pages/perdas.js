async function renderPerdas(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [produtos, motivos] = await Promise.all([
      fetch('/api/produtos').then(r => r.json()),
      fetch('/api/motivos').then(r => r.json()),
    ]);

    // Mapa rápido: id → produto completo
    const mapaProdutos = {};
    produtos.forEach(p => { mapaProdutos[p.id] = p; });

    el.innerHTML = `
      <div class="perda-layout">

        <!-- ── Formulário (esquerda) ── -->
        <div class="card">
          <div class="secao-titulo">📋 Registrar nova perda</div>
          <div id="alerta-perda"></div>
          <form id="form-perda">
            <div class="campo">
              <label>Produto *</label>
              <select id="p-produto" required>
                <option value="">Selecione o produto...</option>
                ${produtos.map(p => `<option value="${p.id}">${p.nome} (${p.unidade})</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Motivo *</label>
              <select id="p-motivo" required>
                <option value="">Selecione o motivo...</option>
                ${motivos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Quantidade *</label>
              <input type="number" id="p-quantidade" min="0.001" step="0.001" placeholder="Ex: 10" required />
            </div>
            <div class="campo">
              <label>Data *</label>
              <input type="date" id="p-data" required value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="campo">
              <label>Observação</label>
              <textarea id="p-obs" placeholder="Opcional..."></textarea>
            </div>
            <button type="submit" class="btn btn-primario btn-block" id="btn-salvar-perda">
              Registrar Perda
            </button>
          </form>
        </div>

        <!-- ── Preview do produto (direita) ── -->
        <div class="card perda-preview" id="preview-produto">
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📦</span>
            <span>Selecione um produto<br>para ver a imagem</span>
          </div>
        </div>

      </div>
    `;

    // ── Atualiza preview ao trocar o produto ─────────────────
    document.getElementById('p-produto').addEventListener('change', (e) => {
      const preview  = document.getElementById('preview-produto');
      const produto  = mapaProdutos[e.target.value];

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
          <img src="${produto.imagem_url}"
               class="perda-preview-img"
               onerror="this.replaceWith(document.getElementById('_sem-img-${produto.id}'))" />
          <div class="perda-preview-nome">${produto.nome}</div>
          <div class="perda-preview-unidade">${produto.unidade}</div>
          <span id="_sem-img-${produto.id}" style="display:none"></span>`;
      } else {
        preview.innerHTML = `
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📷</span>
            <span>Sem imagem cadastrada<br>para este produto</span>
          </div>
          <div class="perda-preview-nome">${produto.nome}</div>`;
      }
    });

    // ── Submete o formulário ─────────────────────────────────
    document.getElementById('form-perda').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-perda');
      const alerta = document.getElementById('alerta-perda');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const res = await fetch('/api/perdas', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id:  document.getElementById('p-produto').value,
            motivo_id:   document.getElementById('p-motivo').value,
            quantidade:  document.getElementById('p-quantidade').value,
            data:        document.getElementById('p-data').value,
            observacao:  document.getElementById('p-obs').value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Perda registrada com sucesso!</div>';
        document.getElementById('form-perda').reset();
        document.getElementById('p-data').value = new Date().toISOString().split('T')[0];

        // Limpa o preview após salvar
        document.getElementById('preview-produto').innerHTML = `
          <div class="perda-preview-vazio">
            <span class="perda-preview-icon">📦</span>
            <span>Selecione um produto<br>para ver a imagem</span>
          </div>`;
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Registrar Perda';
      }
    });

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro ao carregar: ${err.message}</div>`;
  }
}
