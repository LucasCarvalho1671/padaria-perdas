// ── Renderiza seção de funcionários (chamada dentro de configuracoes) ──
async function renderSecaoFuncionarios(container, secao) {
  const labelSecao = { padaria: 'Padaria', acougue: 'Açougue', ambos: 'Ambos' };

  const recarregar = async () => {
    const lista = await fetch('/api/funcionarios?todos=true').then(r => r.json());
    window._cfgFuncionarios = lista;

    const tbody = document.getElementById('tbody-funcionarios');
    if (!tbody) return;
    tbody.innerHTML = lista.length === 0
      ? '<tr><td colspan="4" class="vazio">Nenhum funcionário cadastrado.</td></tr>'
      : lista.map(f => `
          <tr>
            <td>${f.nome}</td>
            <td>${f.funcao || '—'}</td>
            <td><span class="badge badge-cinza">${labelSecao[f.secao] || f.secao}</span></td>
            <td><span class="badge ${f.ativo ? 'badge-verde' : 'badge-cinza'}">${f.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td style="white-space:nowrap">
              <button class="btn btn-secundario btn-sm" onclick="abrirEdicaoFuncionario(${f.id})">✏️</button>
              <button class="btn btn-perigo btn-sm" onclick="excluirFuncionario(${f.id})">✕</button>
            </td>
          </tr>`).join('');
  };

  container.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem">
      <div class="secao-titulo">👷 Funcionários</div>
      <div id="alerta-funcionario"></div>
      <form id="form-funcionario" style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-end;max-width:600px;margin-bottom:1.5rem">
        <div class="campo" style="flex:2;min-width:150px;margin-bottom:0">
          <label>Nome *</label>
          <input type="text" id="fn-nome" placeholder="Nome do funcionário" required />
        </div>
        <div class="campo" style="flex:1;min-width:120px;margin-bottom:0">
          <label>Cargo</label>
          <input type="text" id="fn-funcao" placeholder="Ex: Padeiro" />
        </div>
        <div class="campo" style="min-width:130px;margin-bottom:0">
          <label>Seção</label>
          <select id="fn-secao">
            <option value="ambos">Ambos</option>
            <option value="padaria">Padaria</option>
            <option value="acougue">Açougue</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primario" id="btn-salvar-fn">Adicionar</button>
      </form>

      <!-- Modal edição -->
      <div id="modal-funcionario" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:420px;margin:1rem">
          <div class="secao-titulo">✏️ Editar funcionário</div>
          <div id="alerta-edit-fn"></div>
          <form id="form-editar-fn">
            <input type="hidden" id="ef-id" />
            <div class="campo"><label>Nome *</label><input type="text" id="ef-nome" required /></div>
            <div class="campo"><label>Cargo</label><input type="text" id="ef-funcao" /></div>
            <div class="campo">
              <label>Seção</label>
              <select id="ef-secao">
                <option value="ambos">Ambos</option>
                <option value="padaria">Padaria</option>
                <option value="acougue">Açougue</option>
              </select>
            </div>
            <div class="campo">
              <label>Situação</label>
              <select id="ef-ativo">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-ef">Salvar</button>
              <button type="button" class="btn btn-secundario" onclick="fecharModalFuncionario()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="tabela-wrapper">
        <table>
          <thead><tr><th>Nome</th><th>Cargo</th><th>Seção</th><th>Situação</th><th></th></tr></thead>
          <tbody id="tbody-funcionarios"></tbody>
        </table>
      </div>
    </div>
  `;

  await recarregar();

  // ── Adicionar funcionário ──────────────────────────────────
  document.getElementById('form-funcionario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = document.getElementById('btn-salvar-fn');
    const alerta = document.getElementById('alerta-funcionario');
    alerta.innerHTML = '';
    btn.disabled = true;
    try {
      const res = await fetch('/api/funcionarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:   document.getElementById('fn-nome').value,
          funcao: document.getElementById('fn-funcao').value,
          secao:  document.getElementById('fn-secao').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      document.getElementById('form-funcionario').reset();
      alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Funcionário adicionado!</div>';
      setTimeout(() => { alerta.innerHTML = ''; }, 2500);
      await recarregar();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    } finally {
      btn.disabled = false;
    }
  });

  // ── Salvar edição ──────────────────────────────────────────
  document.getElementById('form-editar-fn').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = document.getElementById('btn-salvar-ef');
    const alerta = document.getElementById('alerta-edit-fn');
    alerta.innerHTML = '';
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      const id  = document.getElementById('ef-id').value;
      const res = await fetch(`/api/funcionarios/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:   document.getElementById('ef-nome').value,
          funcao: document.getElementById('ef-funcao').value,
          secao:  document.getElementById('ef-secao').value,
          ativo:  document.getElementById('ef-ativo').value === 'true',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      fecharModalFuncionario();
      await recarregar();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
}

function abrirEdicaoFuncionario(id) {
  const f = (window._cfgFuncionarios || []).find(x => x.id === id);
  if (!f) return;
  document.getElementById('ef-id').value      = f.id;
  document.getElementById('ef-nome').value    = f.nome;
  document.getElementById('ef-funcao').value  = f.funcao || '';
  document.getElementById('ef-secao').value   = f.secao || 'ambos';
  document.getElementById('ef-ativo').value   = f.ativo ? 'true' : 'false';
  document.getElementById('alerta-edit-fn').innerHTML = '';
  document.getElementById('btn-salvar-ef').disabled    = false;
  document.getElementById('btn-salvar-ef').textContent = 'Salvar';
  document.getElementById('modal-funcionario').style.display = 'flex';
}

function fecharModalFuncionario() {
  document.getElementById('modal-funcionario').style.display = 'none';
}

async function excluirFuncionario(id) {
  const f = (window._cfgFuncionarios || []).find(x => x.id === id);
  if (!f) return;
  const ok = await confirmar(
    `Excluir o funcionário <strong>"${f.nome}"</strong>?<br><br>
     Se ele estiver vinculado a alguma perda, não será possível excluir — use <strong>Editar → Inativo</strong>.`,
    { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' }
  );
  if (!ok) return;
  try {
    const res  = await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { await alertar(data.erro); return; }
    const lista = await fetch('/api/funcionarios?todos=true').then(r => r.json());
    window._cfgFuncionarios = lista;
    const tbody = document.getElementById('tbody-funcionarios');
    if (tbody) {
      const labelSecao = { padaria: 'Padaria', acougue: 'Açougue', ambos: 'Ambos' };
      tbody.innerHTML = lista.length === 0
        ? '<tr><td colspan="5" class="vazio">Nenhum funcionário cadastrado.</td></tr>'
        : lista.map(f => `
            <tr>
              <td>${f.nome}</td>
              <td>${f.funcao || '—'}</td>
              <td><span class="badge badge-cinza">${labelSecao[f.secao] || f.secao}</span></td>
              <td><span class="badge ${f.ativo ? 'badge-verde' : 'badge-cinza'}">${f.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td style="white-space:nowrap">
                <button class="btn btn-secundario btn-sm" onclick="abrirEdicaoFuncionario(${f.id})">✏️</button>
                <button class="btn btn-perigo btn-sm" onclick="excluirFuncionario(${f.id})">✕</button>
              </td>
            </tr>`).join('');
    }
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}
