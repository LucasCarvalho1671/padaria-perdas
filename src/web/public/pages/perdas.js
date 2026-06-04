async function renderPerdas(el, secao = 'padaria') {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [produtos, motivos, funcionarios] = await Promise.all([
      fetch(`/api/produtos?secao=${secao}`).then(r => r.json()),
      fetch(`/api/motivos?secao=${secao}`).then(r => r.json()),
      fetch(`/api/funcionarios?secao=${secao}`).then(r => r.json()),
    ]);

    // Mapas rápidos
    const mapaProdutos = {};
    produtos.forEach(p => { mapaProdutos[p.id] = p; });
    const mapaMotivos = {};
    motivos.forEach(m => { mapaMotivos[m.id] = m; });

    el.innerHTML = `
      <div class="perda-layout">

        <!-- ── Formulário (esquerda) ── -->
        <div class="card">
          <div class="secao-titulo">📋 Registrar nova perda</div>
          <div id="alerta-perda"></div>
          <form id="form-perda">
            <div class="campo">
              <label>Produto *</label>
              ${htmlCombobox('p-produto', 'Digite para pesquisar...', [
                ...produtos.filter(p => p.favorito).map(p => ({ value: p.id, label: `★ ${p.nome} (${p.unidade})` })),
                ...(produtos.some(p => p.favorito) && produtos.some(p => !p.favorito) ? [{ disabled: true }] : []),
                ...produtos.filter(p => !p.favorito).map(p => ({ value: p.id, label: `${p.nome} (${p.unidade})` })),
              ])}
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

            <!-- ── Seção de cobrança por negligência (oculta por padrão) ── -->
            <div id="secao-cobranca" style="display:none;background:#fff7f2;border:1px solid #f0d5c6;border-radius:8px;padding:.9rem;margin-bottom:1rem">
              <div style="font-weight:600;color:var(--cor-primaria);margin-bottom:.75rem">⚠️ Este motivo gera cobrança por negligência</div>
              <div class="campo">
                <label>Funcionário responsável *</label>
                <select id="p-funcionario">
                  <option value="">Selecione o funcionário...</option>
                  ${funcionarios.map(f => `<option value="${f.id}">${f.nome}${f.funcao ? ` — ${f.funcao}` : ''}</option>`).join('')}
                </select>
              </div>
              <div class="campo" style="margin-bottom:0">
                <label>Valor cobrado (R$)</label>
                <input type="number" id="p-valor-cobrado" min="0" step="0.01" placeholder="Calculado automaticamente ou informe manualmente" />
              </div>
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

    ativarComboboxes();

    // ── Mostra/oculta seção de cobrança ao trocar motivo ────
    const atualizarCobranca = () => {
      const motivoId  = document.getElementById('p-motivo').value;
      const motivo    = mapaMotivos[motivoId];
      const secaoDiv  = document.getElementById('secao-cobranca');
      secaoDiv.style.display = motivo?.cobrar_negligencia ? '' : 'none';
      if (!motivo?.cobrar_negligencia) {
        document.getElementById('p-funcionario').value    = '';
        document.getElementById('p-valor-cobrado').value  = '';
      } else {
        calcularValorCobrado();
      }
    };

    const calcularValorCobrado = () => {
      const produtoId = document.getElementById('p-produto').value;
      const qtd       = parseFloat(document.getElementById('p-quantidade').value) || 0;
      const produto   = mapaProdutos[produtoId];
      if (produto?.valor_cobranca && qtd > 0) {
        document.getElementById('p-valor-cobrado').value =
          (produto.valor_cobranca * qtd).toFixed(2);
      }
    };

    document.getElementById('p-motivo').addEventListener('change', atualizarCobranca);
    document.getElementById('p-quantidade').addEventListener('input', () => {
      if (document.getElementById('secao-cobranca').style.display !== 'none') calcularValorCobrado();
    });

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
      // Recalcula cobrança ao trocar produto
      if (document.getElementById('secao-cobranca').style.display !== 'none') calcularValorCobrado();

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

      if (!document.getElementById('p-produto').value) {
        alerta.innerHTML = '<div class="alerta alerta-erro">Selecione um produto da lista.</div>';
        btn.disabled = false;
        btn.textContent = 'Registrar Perda';
        return;
      }

      try {
        const motivoId    = document.getElementById('p-motivo').value;
        const cobrar      = mapaMotivos[motivoId]?.cobrar_negligencia;
        const funcId      = document.getElementById('p-funcionario').value;
        const valorCobr   = document.getElementById('p-valor-cobrado').value;

        // Valida funcionário se motivo cobra negligência
        if (cobrar && !funcId) {
          alerta.innerHTML = '<div class="alerta alerta-erro">Selecione o funcionário responsável.</div>';
          btn.disabled = false;
          btn.textContent = 'Registrar Perda';
          return;
        }

        const res = await fetch('/api/perdas', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id:              document.getElementById('p-produto').value,
            motivo_id:               motivoId,
            quantidade:              document.getElementById('p-quantidade').value,
            data:                    document.getElementById('p-data').value,
            observacao:              document.getElementById('p-obs').value,
            secao,
            funcionario_cobrado_id:  cobrar && funcId ? funcId : null,
            valor_cobrado:           cobrar && valorCobr ? valorCobr : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Perda registrada com sucesso!</div>';
        document.getElementById('form-perda').reset();
        document.getElementById('p-data').value = new Date().toISOString().split('T')[0];
        document.getElementById('secao-cobranca').style.display = 'none';

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
