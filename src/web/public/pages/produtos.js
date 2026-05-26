async function renderProdutos(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const produtos = await fetch('/api/produtos').then(r => r.json());

    el.innerHTML = `
      <!-- Modal de edição -->
      <div id="modal-produto" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:480px;margin:1rem">
          <div class="secao-titulo">✏️ Editar produto</div>
          <div id="alerta-edit"></div>
          <form id="form-editar">
            <input type="hidden" id="edit-id" />
            <div class="campo">
              <label>Nome do produto *</label>
              <input type="text" id="edit-nome" required />
            </div>
            <div class="campo">
              <label>Unidade de medida *</label>
              <select id="edit-unidade" required>
                <option value="unidade">Unidade</option>
                <option value="kg">Kg</option>
                <option value="g">Gramas (g)</option>
                <option value="litro">Litro</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="bandeja">Bandeja</option>
                <option value="pacote">Pacote</option>
                <option value="fatia">Fatia</option>
              </select>
            </div>
            <div class="campo">
              <label>Custo unitário (R$) <small style="color:#999">— opcional</small></label>
              <input type="number" id="edit-custo" min="0" step="0.01" placeholder="Ex: 0.80" />
            </div>
            <div class="campo">
              <label>URL da imagem de referência <small style="color:#999">— opcional</small></label>
              <input type="url" id="edit-imagem" placeholder="https://..." />
              <div id="edit-preview" style="margin-top:.5rem"></div>
            </div>
            <div class="campo">
              <label>Situação</label>
              <select id="edit-ativo">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-edit">Salvar</button>
              <button type="button" class="btn btn-secundario" id="btn-cancelar-edit">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Formulário de cadastro -->
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
              <option value="fatia">Fatia</option>
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

      <!-- Lista de produtos -->
      <div class="card">
        <div class="secao-titulo">Lista de produtos (${produtos.length})</div>
        <div class="tabela-wrapper">
          ${produtos.length === 0
            ? '<div class="vazio">Nenhum produto cadastrado.</div>'
            : `<table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Nome</th>
                    <th>Unidade</th>
                    <th>Custo</th>
                    <th>Situação</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${produtos.map(p => `
                    <tr>
                      <td>
                        ${p.imagem_url
                          ? `<img src="${p.imagem_url}" class="produto-thumb" />`
                          : '<span style="color:#ccc;font-size:1.4rem">📷</span>'}
                      </td>
                      <td>${p.nome}</td>
                      <td>${p.unidade}</td>
                      <td>${p.custo
                            ? 'R$ ' + Number(p.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            : '<span style="color:#bbb">—</span>'}</td>
                      <td>
                        <span class="badge ${p.ativo ? 'badge-verde' : 'badge-cinza'}">
                          ${p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          class="btn btn-secundario btn-sm"
                          onclick="abrirEdicao(${p.id}, '${p.nome.replace(/'/g, "\\'")}', '${p.unidade}', '${p.custo || ''}', '${p.imagem_url || ''}', ${p.ativo})">
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>`).join('')}
                </tbody>
               </table>`}
        </div>
      </div>
    `;

    // ── Cadastrar novo produto ────────────────────────────────
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

        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Produto cadastrado!</div>';
        setTimeout(() => renderProdutos(document.getElementById('conteudo')), 1000);
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Cadastrar Produto';
      }
    });

    // ── Modal: cancelar ───────────────────────────────────────
    document.getElementById('btn-cancelar-edit').onclick = fecharModal;

    // ── Modal: preview da imagem ao digitar URL ───────────────
    document.getElementById('edit-imagem').addEventListener('input', (e) => {
      const preview = document.getElementById('edit-preview');
      const url = e.target.value.trim();
      preview.innerHTML = url
        ? `<img src="${url}" style="max-height:80px;border-radius:6px;border:1px solid #eee"
             onerror="this.style.display='none'" />`
        : '';
    });

    // ── Modal: salvar edição ──────────────────────────────────
    document.getElementById('form-editar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-edit');
      const alerta = document.getElementById('alerta-edit');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const id  = document.getElementById('edit-id').value;
        const res = await fetch(`/api/produtos/${id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:       document.getElementById('edit-nome').value,
            unidade:    document.getElementById('edit-unidade').value,
            custo:      document.getElementById('edit-custo').value || null,
            imagem_url: document.getElementById('edit-imagem').value || null,
            ativo:      document.getElementById('edit-ativo').value === 'true',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        fecharModal();
        renderProdutos(document.getElementById('conteudo'));
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}

// Abre o modal preenchido com os dados do produto
function abrirEdicao(id, nome, unidade, custo, imagem_url, ativo) {
  document.getElementById('edit-id').value       = id;
  document.getElementById('edit-nome').value     = nome;
  document.getElementById('edit-unidade').value  = unidade;
  document.getElementById('edit-custo').value    = custo || '';
  document.getElementById('edit-imagem').value   = imagem_url || '';
  document.getElementById('edit-ativo').value    = ativo ? 'true' : 'false';
  document.getElementById('alerta-edit').innerHTML = '';

  // Preview da imagem já existente
  const preview = document.getElementById('edit-preview');
  preview.innerHTML = imagem_url
    ? `<img src="${imagem_url}" style="max-height:80px;border-radius:6px;border:1px solid #eee"
         onerror="this.style.display='none'" />`
    : '';

  const modal = document.getElementById('modal-produto');
  modal.style.display = 'flex';
  document.getElementById('btn-salvar-edit').disabled = false;
  document.getElementById('btn-salvar-edit').textContent = 'Salvar';
}

function fecharModal() {
  document.getElementById('modal-produto').style.display = 'none';
}
