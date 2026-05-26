async function renderConfiguracoes(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [usuarios, motivos] = await Promise.all([
      fetch('/api/usuarios').then(r => r.json()),
      fetch('/api/motivos').then(r => r.json()),
    ]);

    el.innerHTML = `
      <!-- Usuários -->
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
            <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Situação</th></tr></thead>
            <tbody>
              ${usuarios.map(u => `
                <tr>
                  <td>${u.nome}</td>
                  <td>${u.email}</td>
                  <td><span class="badge badge-cinza">${u.role}</span></td>
                  <td><span class="badge ${u.ativo ? 'badge-verde' : 'badge-cinza'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Motivos de perda -->
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
            <thead><tr><th>Motivo</th><th>Situação</th></tr></thead>
            <tbody>
              ${motivos.map(m => `
                <tr>
                  <td>${m.nome}</td>
                  <td><span class="badge ${m.ativo ? 'badge-verde' : 'badge-cinza'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Salvar usuário
    document.getElementById('form-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-usuario');
      const alerta = document.getElementById('alerta-usuario');
      alerta.innerHTML = '';
      btn.disabled = true;

      try {
        const res = await fetch('/api/usuarios', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
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

    // Salvar motivo
    document.getElementById('form-motivo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = document.getElementById('btn-salvar-motivo');
      const alerta = document.getElementById('alerta-motivo');
      alerta.innerHTML = '';
      btn.disabled = true;

      try {
        const res = await fetch('/api/motivos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
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

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}
