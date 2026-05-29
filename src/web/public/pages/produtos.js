// ── Seletor de imagens global ─────────────────────────────
// Abre modal com campo de busca editável + Wikipedia + Pixabay
// campoId: id do <input> que vai receber a URL escolhida
// previewId: id do elemento que mostra o preview
async function abrirSeletorImagens(nomeProduto, campoId, previewId) {
  const modal  = document.getElementById('img-picker-modal');
  const titulo = document.getElementById('img-picker-titulo');
  const input  = document.getElementById('img-picker-q');

  titulo.textContent = `Escolha uma imagem para: ${nomeProduto}`;
  input.value        = nomeProduto;   // pré-preenche com o nome do produto

  modal._campoId   = campoId;
  modal._previewId = previewId;
  modal.classList.add('aberto');

  // Foca no input para facilitar edição imediata
  setTimeout(() => input.focus(), 80);

  await buscarImagensModal();
}

// Lê o termo atual do input e busca novas imagens
async function buscarImagensModal() {
  const grid  = document.getElementById('img-picker-grid');
  const modal = document.getElementById('img-picker-modal');
  const termo = document.getElementById('img-picker-q').value.trim();

  if (!termo) return;

  grid.innerHTML = '<div class="img-picker-vazio">🔍 Buscando imagens...</div>';

  const { _campoId: campoId, _previewId: previewId } = modal;

  try {
    const res  = await fetch(`/api/imagens/buscar?q=${encodeURIComponent(termo)}`);
    const data = await res.json();

    if (!data.imagens?.length) {
      grid.innerHTML = '<div class="img-picker-vazio">Nenhuma imagem encontrada.<br>Tente outros termos de busca (em inglês funciona melhor).</div>';
      return;
    }

    grid.innerHTML = data.imagens.map((url, i) => `
      <div class="img-picker-opcao" onclick="selecionarImagem('${url}', '${campoId}', '${previewId}')">
        <img src="${url}" alt="Opção ${i + 1}"
             onerror="this.closest('.img-picker-opcao').style.display='none'" />
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<div class="img-picker-vazio">Erro ao buscar imagens. Tente novamente.</div>';
  }
}

function selecionarImagem(url, campoId, previewId) {
  document.getElementById(campoId).value = url;
  atualizarPreview(url, previewId);
  fecharSeletorImagens();
}

function fecharSeletorImagens() {
  document.getElementById('img-picker-modal').classList.remove('aberto');
}

function atualizarPreview(url, previewId) {
  const el = document.getElementById(previewId);
  if (!el) return;
  el.innerHTML = url
    ? `<img src="${url}" style="max-height:80px;border-radius:6px;border:1px solid #eee;margin-top:.4rem"
         onerror="this.style.display='none'" />`
    : '';
}

// ── Tela de Produtos ──────────────────────────────────────
async function renderProdutos(el, secao = 'padaria') {
  el.dataset.secao = secao;
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const produtos = await fetch(`/api/produtos?todos=true&secao=${secao}`).then(r => r.json());

    el.innerHTML = `
      <!-- Modal seletor de imagens -->
      <div id="img-picker-modal" class="img-picker-modal">
        <div class="img-picker-box">
          <div id="img-picker-titulo" class="img-picker-titulo"></div>
          <div class="img-picker-busca">
            <input type="text" id="img-picker-q" placeholder="Pesquisar imagens (ex: french bread)..."
              onkeydown="if(event.key==='Enter'){event.preventDefault();buscarImagensModal()}" />
            <button class="btn btn-primario btn-sm" onclick="buscarImagensModal()">🔍 Buscar</button>
          </div>
          <div id="img-picker-grid" class="img-picker-grid"></div>
          <button class="btn btn-secundario btn-block" onclick="fecharSeletorImagens()">Cancelar</button>
        </div>
      </div>

      <!-- Modal de edição -->
      <div id="modal-produto" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:480px;margin:1rem;max-height:90vh;overflow-y:auto">
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
              <label>Imagem de referência</label>
              <div style="display:flex;gap:.5rem;align-items:center">
                <input type="url" id="edit-imagem" placeholder="https://..." style="flex:1" />
                <button type="button" class="btn btn-secundario btn-sm"
                  onclick="abrirSeletorImagens(document.getElementById('edit-nome').value || 'produto', 'edit-imagem', 'edit-preview')">
                  🔍 Buscar
                </button>
              </div>
              <div id="edit-preview" style="margin-top:.4rem"></div>
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
      ${temPermissao('cadastrar_produto') ? `<div class="card" style="max-width:560px;margin-bottom:1.5rem">` : `<div class="card" style="max-width:560px;margin-bottom:1.5rem;display:none">`}
        <div class="secao-titulo">${secao === 'acougue' ? '🥩' : '🥖'} Cadastrar produto</div>
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
            <label>Imagem de referência <small style="color:#999">— opcional</small></label>
            <div style="display:flex;gap:.5rem;align-items:center">
              <input type="url" id="pd-imagem" placeholder="https://..." style="flex:1" />
              <button type="button" class="btn btn-secundario btn-sm"
                onclick="abrirSeletorImagens(document.getElementById('pd-nome').value || 'produto', 'pd-imagem', 'pd-preview')">
                🔍 Buscar
              </button>
            </div>
            <div id="pd-preview"></div>
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
                  <tr><th></th><th>Nome</th><th>Unidade</th><th>Custo</th><th>Situação</th><th></th></tr>
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
                      <td>${p.custo ? 'R$ ' + Number(p.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '<span style="color:#bbb">—</span>'}</td>
                      <td><span class="badge ${p.ativo ? 'badge-verde' : 'badge-cinza'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td>
                        ${temPermissao('editar_produto') ? `
                        <button class="btn-favorito ${p.favorito ? 'ativo' : ''}" title="${p.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                          onclick="toggleFavorito(${p.id})">
                          ${p.favorito ? '★' : '☆'}
                        </button>` : ''}
                        ${temPermissao('editar_produto') ? `
                        <button class="btn btn-secundario btn-sm"
                          onclick="abrirEdicao(${p.id}, '${p.nome.replace(/'/g, "\\'")}', '${p.unidade}', '${p.custo || ''}', '${(p.imagem_url || '').replace(/'/g, "\\'")}', ${p.ativo})">
                          ✏️ Editar
                        </button>` : ''}
                        ${temPermissao('excluir_produto') ? `
                        <button class="btn btn-perigo btn-sm"
                          onclick="excluirProduto(${p.id}, '${p.nome.replace(/'/g, "\\'")}')">
                          🗑️
                        </button>` : ''}
                      </td>
                    </tr>`).join('')}
                </tbody>
               </table>`}
        </div>
      </div>
    `;

    // ── Preview ao digitar URL no cadastro ────────────────────
    document.getElementById('pd-imagem').addEventListener('input', (e) => {
      atualizarPreview(e.target.value.trim(), 'pd-preview');
    });

    // ── Preview ao digitar URL na edição ─────────────────────
    document.getElementById('edit-imagem').addEventListener('input', (e) => {
      atualizarPreview(e.target.value.trim(), 'edit-preview');
    });

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
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:       document.getElementById('pd-nome').value,
            unidade:    document.getElementById('pd-unidade').value,
            custo:      document.getElementById('pd-custo').value || null,
            imagem_url: document.getElementById('pd-imagem').value || null,
            secao,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Produto cadastrado!</div>';
        setTimeout(() => renderProdutos(document.getElementById('conteudo'), secao), 1000);
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Cadastrar Produto';
      }
    });

    // ── Modal: cancelar ───────────────────────────────────────
    document.getElementById('btn-cancelar-edit').onclick = fecharModal;

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
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
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
        const el = document.getElementById('conteudo');
        renderProdutos(el, el.dataset.secao || 'padaria');
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

// ── Abre modal de edição preenchido ──────────────────────
function abrirEdicao(id, nome, unidade, custo, imagem_url, ativo) {
  document.getElementById('edit-id').value      = id;
  document.getElementById('edit-nome').value    = nome;
  document.getElementById('edit-unidade').value = unidade;
  document.getElementById('edit-custo').value   = custo || '';
  document.getElementById('edit-imagem').value  = imagem_url || '';
  document.getElementById('edit-ativo').value   = ativo ? 'true' : 'false';
  document.getElementById('alerta-edit').innerHTML = '';
  atualizarPreview(imagem_url, 'edit-preview');

  const modal = document.getElementById('modal-produto');
  modal.style.display = 'flex';
  document.getElementById('btn-salvar-edit').disabled = false;
  document.getElementById('btn-salvar-edit').textContent = 'Salvar';
}

function fecharModal() {
  document.getElementById('modal-produto').style.display = 'none';
}

async function toggleFavorito(id) {
  await fetch(`/api/produtos/${id}/favorito`, { method: 'PATCH' });
  const el = document.getElementById('conteudo');
  renderProdutos(el, el.dataset.secao || 'padaria');
}

async function excluirProduto(id, nome) {
  const ok = await confirmar(
    `Excluir o produto <strong>"${nome}"</strong>?<br><br>
     Se ele já possui perdas ou produções registradas, não será possível excluir — use <strong>Editar → Inativo</strong> em vez disso.`,
    { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' }
  );
  if (!ok) return;
  try {
    const res  = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { await alertar(data.erro); return; }
    const el = document.getElementById('conteudo');
    renderProdutos(el, el.dataset.secao || 'padaria');
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}
