async function renderProdutos(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const produtos = await fetch('/api/produtos').then(r => r.json());

    el.innerHTML = `
      <div class="card" style="max-width:560px;margin-bottom:1.5rem">
        <div class="secao-titulo">🥖 Cadastrar produto</div>
        <div id="alerta-prod-cad"></div>
        <form id="form-produto">
          <div class="campo">
            <label>Nome do produto *</label>
            <input type="text" id="pd-nome" placeholder="Ex: Pão Francês" required />
          </div>
          <div class="campo">
            <label>Unidade de medida *</label>
            <select id="pd-unidade" required>
              <option value="unidade">Unidade</option>
              <option value="kg">Kg</option>
              <option value="g">Gramas (g)</option>
              <option value="litro">Litro</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="bandeja">Bandeja</option>
              <option value="pacote">Pacote</option>
            </select>
          </div>
          <div class="campo">
            <label>Custo unitário (R$) <small style="color:#999">— opcional</small></label>
            <input type="number" id="pd-custo" min="0" step="0.01" placeholder="Ex: 0.80" />
          </div>
          <div class="campo">
            <label>URL da imagem de referência <small style="color:#999">— opcional</small></label>
            <input type="url" id="pd-imagem" placeholder="https://..." />
          </div>
          <button type="submit" class="btn btn-primario btn-block" id="btn-salvar-pd">
            Cadastrar Produto
          </button>
        </form>
      </div>

      <div class="card">
        <div class="secao-titulo">Lista de produtos</div>
        <div class="tabela-wrapper">
          ${produtos.length === 0
            ? '<div class="vazio">Nenhum produto cadastrado.</div>'
            : `<table>
                <thead><tr><th></th><th>Nome</th><th>Unidade</th><th>Custo</th><th>Situação</th></tr></thead>
                <tbody id="tbody-produtos">
                  ${produtos.map(p => `
                    <tr>
                      <td>${p.imagem_url ? `<img src="${p.imagem_url}" class="produto-thumb" />` : '—'}</td>
                      <td>${p.nome}</td>
                      <td>${p.unidade}</td>
                      <td>${p.custo ? 'R$ ' + Number(p.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</td>
                      <td><span class="badge ${p.ativo ? 'badge-verde' : 'badge-cinza'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    </tr>`).join('')}
                </tbody>
               </table>`}
        </div>
      </div>
    `;

    document.getElementById('form-produto').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-pd');
      const alerta = document.getElementById('alerta-prod-cad');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const res = await fetch('/api/produtos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:       document.getElementById('pd-nome').value,
            unidade:    document.getElementById('pd-unidade').value,
            custo:      document.getElementById('pd-custo').value || null,
            imagem_url: document.getElementById('pd-imagem').value || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Produto cadastrado! Recarregando...</div>';
        setTimeout(() => renderProdutos(document.getElementById('conteudo')), 1200);
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Cadastrar Produto';
      }
    });

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}
