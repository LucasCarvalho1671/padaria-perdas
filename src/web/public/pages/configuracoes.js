async function renderConfiguracoes(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [usuarios, motivos] = await Promise.all([
      fetch('/api/usuarios').then(r => r.json()),
      fetch('/api/motivos?todos=true').then(r => r.json()),
    ]);

    el.innerHTML = `
      <!-- ── Modal edição de usuário ── -->
      <div id="modal-usuario" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:440px;margin:1rem;max-height:90vh;overflow-y:auto">
          <div class="secao-titulo">✏️ Editar usuário</div>
          <div id="alerta-edit-usuario"></div>
          <form id="form-editar-usuario">
            <input type="hidden" id="eu-id" />
            <div class="campo">
              <label>Nome *</label>
              <input type="text" id="eu-nome" required />
            </div>
            <div class="campo">
              <label>Email *</label>
              <input type="email" id="eu-email" required />
            </div>
            <div class="campo">
              <label>Perfil</label>
              <select id="eu-role">
                <option value="funcionario">Funcionário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="campo">
              <label>Situação</label>
              <select id="eu-ativo">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div class="campo">
              <label>Nova senha <small style="color:#999">— deixe em branco para não alterar</small></label>
              <input type="password" id="eu-senha" placeholder="Mínimo 6 caracteres" minlength="6" />
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-eu">Salvar</button>
              <button type="button" class="btn btn-secundario" onclick="fecharModalUsuario()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Modal edição de motivo ── -->
      <div id="modal-motivo" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:400px;margin:1rem">
          <div class="secao-titulo">✏️ Editar motivo</div>
          <div id="alerta-edit-motivo"></div>
          <form id="form-editar-motivo">
            <input type="hidden" id="em-id" />
            <div class="campo">
              <label>Nome *</label>
              <input type="text" id="em-nome" required />
            </div>
            <div class="campo">
              <label>Situação</label>
              <select id="em-ativo">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div style="display:flex;gap:.75rem;margin-top:.5rem">
              <button type="submit" class="btn btn-primario" id="btn-salvar-em">Salvar</button>
              <button type="button" class="btn btn-secundario" onclick="fecharModalMotivo()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Seção Usuários ── -->
      <div class="card" style="margin-bottom:1.5rem">
        <div class="secao-titulo">👤 Usuários</div>
        <div id="alerta-usuario"></div>
        <form id="form-usuario" style="max-width:480px;margin-bottom:1.5rem">
          <div class="campo">
            <label>Nome *</label>
            <input type="text" id="u-nome" placeholder="Nome completo" required />
          </div>
          <div class="campo">
            <label>Email *</label>
            <input type="email" id="u-email" placeholder="email@padaria.com" required />
          </div>
          <div class="campo">
            <label>Senha *</label>
            <input type="password" id="u-senha" placeholder="Mínimo 6 caracteres" required minlength="6" />
          </div>
          <button type="submit" class="btn btn-primario" id="btn-salvar-usuario">
            Adicionar Usuário
          </button>
        </form>

        <div class="tabela-wrapper">
          <table>
            <thead>
              <tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Situação</th><th></th></tr>
            </thead>
            <tbody>
              ${usuarios.map(u => `
                <tr>
                  <td>${u.nome}</td>
                  <td>${u.email}</td>
                  <td><span class="badge badge-cinza">${u.role}</span></td>
                  <td><span class="badge ${u.ativo ? 'badge-verde' : 'badge-cinza'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <button class="btn btn-secundario btn-sm"
                      onclick="abrirEdicaoUsuario(${u.id}, '${u.nome.replace(/'/g, "\\'")}', '${u.email}', '${u.role}', ${u.ativo})">
                      ✏️ Editar
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Seção Motivos ── -->
      <div class="card">
        <div class="secao-titulo">📌 Motivos de perda</div>
        <div id="alerta-motivo"></div>
        <form id="form-motivo" style="display:flex;gap:.75rem;align-items:flex-end;max-width:480px;margin-bottom:1.5rem">
          <div class="campo" style="flex:1;margin-bottom:0">
            <label>Novo motivo *</label>
            <input type="text" id="m-nome" placeholder="Ex: Produto aberto" required />
          </div>
          <button type="submit" class="btn btn-primario" id="btn-salvar-motivo">Adicionar</button>
        </form>

        <div class="tabela-wrapper">
          <table>
            <thead>
              <tr><th>Motivo</th><th>Situação</th><th></th></tr>
            </thead>
            <tbody>
              ${motivos.map(m => `
                <tr>
                  <td>${m.nome}</td>
                  <td><span class="badge ${m.ativo ? 'badge-verde' : 'badge-cinza'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secundario btn-sm"
                      onclick="abrirEdicaoMotivo(${m.id}, '${m.nome.replace(/'/g, "\\'")}', ${m.ativo})">
                      ✏️ Editar
                    </button>
                    <button class="btn btn-perigo btn-sm"
                      onclick="excluirMotivo(${m.id}, '${m.nome.replace(/'/g, "\\'")}')">
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // ── Adicionar usuário ────────────────────────────────────
    document.getElementById('form-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-usuario');
      const alerta = document.getElementById('alerta-usuario');
      alerta.innerHTML = '';
      btn.disabled = true;
      try {
        const res = await fetch('/api/usuarios', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:  document.getElementById('u-nome').value,
            email: document.getElementById('u-email').value,
            senha: document.getElementById('u-senha').value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Usuário adicionado!</div>';
        setTimeout(() => renderConfiguracoes(document.getElementById('conteudo')), 1200);
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
      }
    });

    // ── Adicionar motivo ─────────────────────────────────────
    document.getElementById('form-motivo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-motivo');
      const alerta = document.getElementById('alerta-motivo');
      alerta.innerHTML = '';
      btn.disabled = true;
      try {
        const res = await fetch('/api/motivos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: document.getElementById('m-nome').value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        alerta.innerHTML = '<div class="alerta alerta-sucesso">✅ Motivo adicionado!</div>';
        setTimeout(() => renderConfiguracoes(document.getElementById('conteudo')), 1200);
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
      }
    });

    // ── Salvar edição de usuário ─────────────────────────────
    document.getElementById('form-editar-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-eu');
      const alerta = document.getElementById('alerta-edit-usuario');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      try {
        const id    = document.getElementById('eu-id').value;
        const senha = document.getElementById('eu-senha').value;
        const body  = {
          nome:  document.getElementById('eu-nome').value,
          email: document.getElementById('eu-email').value,
          role:  document.getElementById('eu-role').value,
          ativo: document.getElementById('eu-ativo').value === 'true',
        };
        if (senha && senha.length >= 6) body.senha = senha;

        const res = await fetch(`/api/usuarios/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        fecharModalUsuario();
        renderConfiguracoes(document.getElementById('conteudo'));
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });

    // ── Salvar edição de motivo ──────────────────────────────
    document.getElementById('form-editar-motivo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-em');
      const alerta = document.getElementById('alerta-edit-motivo');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      try {
        const id  = document.getElementById('em-id').value;
        const res = await fetch(`/api/motivos/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:  document.getElementById('em-nome').value,
            ativo: document.getElementById('em-ativo').value === 'true',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        fecharModalMotivo();
        renderConfiguracoes(document.getElementById('conteudo'));
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

// ── Usuário: abrir/fechar modal ──────────────────────────────
function abrirEdicaoUsuario(id, nome, email, role, ativo) {
  document.getElementById('eu-id').value    = id;
  document.getElementById('eu-nome').value  = nome;
  document.getElementById('eu-email').value = email;
  document.getElementById('eu-role').value  = role;
  document.getElementById('eu-ativo').value = ativo ? 'true' : 'false';
  document.getElementById('eu-senha').value = '';
  document.getElementById('alerta-edit-usuario').innerHTML = '';
  document.getElementById('btn-salvar-eu').disabled    = false;
  document.getElementById('btn-salvar-eu').textContent = 'Salvar';
  document.getElementById('modal-usuario').style.display = 'flex';
}

function fecharModalUsuario() {
  document.getElementById('modal-usuario').style.display = 'none';
}

// ── Motivo: abrir/fechar modal ───────────────────────────────
function abrirEdicaoMotivo(id, nome, ativo) {
  document.getElementById('em-id').value    = id;
  document.getElementById('em-nome').value  = nome;
  document.getElementById('em-ativo').value = ativo ? 'true' : 'false';
  document.getElementById('alerta-edit-motivo').innerHTML = '';
  document.getElementById('btn-salvar-em').disabled    = false;
  document.getElementById('btn-salvar-em').textContent = 'Salvar';
  document.getElementById('modal-motivo').style.display = 'flex';
}

function fecharModalMotivo() {
  document.getElementById('modal-motivo').style.display = 'none';
}

// ── Excluir motivo ───────────────────────────────────────────
async function excluirMotivo(id, nome) {
  if (!confirm(`Excluir o motivo "${nome}"?\n\nSe ele já foi usado em alguma perda registrada, não será possível excluir — apenas inativar.`)) return;
  try {
    const res  = await fetch(`/api/motivos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.erro); return; }
    renderConfiguracoes(document.getElementById('conteudo'));
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}
