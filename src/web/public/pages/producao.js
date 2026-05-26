async function renderProducao(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const produtos = await fetch('/api/produtos').then(r => r.json());

    el.innerHTML = `
      <div class="card" style="max-width:560px;margin-bottom:1.5rem">
        <div class="secao-titulo">🏭 Registrar produção</div>
        <div id="alerta-prod"></div>
        <form id="form-prod">
          <div class="campo">
            <label>Produto *</label>
            <select id="pr-produto" required>
              <option value="">Selecione o produto...</option>
              ${produtos.map(p => `<option value="${p.id}">${p.nome} (${p.unidade})</option>`).join('')}
            </select>
          </div>
          <div class="campo">
            <label>Quantidade produzida *</label>
            <input type="number" id="pr-quantidade" min="0.001" step="0.001" placeholder="Ex: 100" required />
          </div>
          <div class="campo">
            <label>Data *</label>
            <input type="date" id="pr-data" required value="${new Date().toISOString().split('T')[0]}" />
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
    `;

    document.getElementById('form-prod').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-prod');
      const alerta = document.getElementById('alerta-prod');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const res = await fetch('/api/producao', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_id: document.getElementById('pr-produto').value,
            quantidade: document.getElementById('pr-quantidade').value,
            data:       document.getElementById('pr-data').value,
            observacao: document.getElementById('pr-obs').value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Produção registrada com sucesso!</div>';
        document.getElementById('form-prod').reset();
        document.getElementById('pr-data').value = new Date().toISOString().split('T')[0];
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Registrar Produção';
      }
    });

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro ao carregar: ${err.message}</div>`;
  }
}
