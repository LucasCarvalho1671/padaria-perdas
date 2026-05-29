async function renderConfiguracoes(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const isAdmin             = window.usuarioAtual?.role === 'admin';
    const podeGerenciarUsers  = isAdmin || temPermissao('gerenciar_usuarios');
    const podeGerenciarMotivos = isAdmin || temPermissao('gerenciar_motivos');

    const promises = [];
    if (podeGerenciarUsers)   promises.push(fetch('/api/usuarios').then(r => r.json()));
    else                      promises.push(Promise.resolve([]));
    if (podeGerenciarMotivos) {
      promises.push(fetch('/api/motivos?todos=true&secao=padaria').then(r => r.json()));
      promises.push(fetch('/api/motivos?todos=true&secao=acougue').then(r => r.json()));
    } else {
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
    }

    const [usuarios, motivosPadaria, motivosAcougue] = await Promise.all(promises);

    // Armazena para uso nas funções do dropdown
    window._cfgUsuarios = usuarios;

    const labelAcesso = { padaria: 'Padaria', acougue: 'Açougue', ambos: 'Ambos' };

    const linhaMotivo = (m) => `
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
      </tr>`;

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
              <label>Acesso</label>
              <select id="eu-acesso">
                <option value="ambos">Ambos (Padaria + Açougue)</option>
                <option value="padaria">Somente Padaria</option>
                <option value="acougue">Somente Açougue</option>
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

      <!-- ── Modal de permissões ── -->
      <div id="modal-permissoes" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:510;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:460px;margin:1rem;max-height:90vh;overflow-y:auto">
          <div class="secao-titulo">🔑 Permissões: <span id="perm-nome-usuario" style="color:var(--cor-primaria)"></span></div>
          <input type="hidden" id="perm-usuario-id" />
          <div id="perm-admin-aviso" class="alerta alerta-info" style="display:none;margin-bottom:1rem">
            ⭐ Usuário Admin — tem acesso total ao sistema, independente de permissões.
          </div>
          <div id="perm-checkboxes">
            <div class="perm-grupo">
              <div class="perm-grupo-titulo">📋 Registros</div>
              <label class="perm-item"><input type="checkbox" id="perm-registrar_perda" /> Registrar perda</label>
              <label class="perm-item"><input type="checkbox" id="perm-editar_perda" /> Editar perda</label>
              <label class="perm-item"><input type="checkbox" id="perm-excluir_perda" /> Excluir perda</label>
              <label class="perm-item"><input type="checkbox" id="perm-registrar_producao" /> Registrar produção</label>
              <label class="perm-item"><input type="checkbox" id="perm-editar_producao" /> Editar produção</label>
              <label class="perm-item"><input type="checkbox" id="perm-excluir_producao" /> Excluir produção</label>
            </div>
            <hr class="perm-separador" />
            <div class="perm-grupo">
              <div class="perm-grupo-titulo">👁️ Visualização</div>
              <label class="perm-item"><input type="checkbox" id="perm-ver_dashboard" /> Ver dashboard</label>
              <label class="perm-item"><input type="checkbox" id="perm-ver_historico" /> Ver histórico de perdas</label>
              <label class="perm-item"><input type="checkbox" id="perm-exportar_relatorio" /> Exportar relatório Excel</label>
            </div>
            <hr class="perm-separador" />
            <div class="perm-grupo">
              <div class="perm-grupo-titulo">🥖 Produtos</div>
              <label class="perm-item"><input type="checkbox" id="perm-cadastrar_produto" /> Cadastrar produto</label>
              <label class="perm-item"><input type="checkbox" id="perm-editar_produto" /> Editar produto</label>
              <label class="perm-item"><input type="checkbox" id="perm-excluir_produto" /> Excluir produto</label>
            </div>
            <hr class="perm-separador" />
            <div class="perm-grupo">
              <div class="perm-grupo-titulo">⚙️ Configurações</div>
              <label class="perm-item"><input type="checkbox" id="perm-gerenciar_motivos" /> Gerenciar motivos de perda</label>
              <label class="perm-item"><input type="checkbox" id="perm-gerenciar_usuarios" /> Gerenciar usuários</label>
            </div>
          </div>
          <div id="alerta-perm" style="margin-top:.5rem"></div>
          <div style="display:flex;gap:.75rem;margin-top:1rem">
            <button class="btn btn-primario" id="btn-salvar-perm">Salvar permissões</button>
            <button class="btn btn-secundario" onclick="fecharModalPermissoes()">Cancelar</button>
          </div>
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
      ${podeGerenciarUsers ? `
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
          <div class="campo">
            <label>Perfil</label>
            <select id="u-role">
              <option value="funcionario">Funcionário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="campo">
            <label>Acesso</label>
            <select id="u-acesso">
              <option value="ambos">Ambos (Padaria + Açougue)</option>
              <option value="padaria">Somente Padaria</option>
              <option value="acougue">Somente Açougue</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primario" id="btn-salvar-usuario">
            Adicionar Usuário
          </button>
        </form>

        <div class="tabela-wrapper">
          <table>
            <thead>
              <tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Acesso</th><th>Situação</th><th></th></tr>
            </thead>
            <tbody>
              ${usuarios.map(u => `
                <tr>
                  <td>${u.nome}</td>
                  <td>${u.email}</td>
                  <td><span class="badge badge-cinza">${u.role}</span></td>
                  <td><span class="badge badge-cinza">${labelAcesso[u.acesso] || u.acesso || 'Ambos'}</span></td>
                  <td><span class="badge ${u.ativo ? 'badge-verde' : 'badge-cinza'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td style="text-align:right;white-space:nowrap">
                    <div class="dropdown-wrapper">
                      <button class="btn-tres-pontos" onclick="toggleDropdownUsuario(${u.id}, event)" title="Ações">⋯</button>
                      <div class="dropdown-menu" id="dd-usuario-${u.id}">
                        <button class="dropdown-item" onclick="abrirEdicaoUsuarioById(${u.id})">✏️ Editar dados</button>
                        ${isAdmin ? `<button class="dropdown-item" onclick="abrirPermissoesById(${u.id})">🔑 Permissões</button>` : ''}
                        <button class="dropdown-item perigo" onclick="excluirUsuarioById(${u.id})">🗑️ Excluir</button>
                      </div>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- ── Seção Manutenção (apenas admin) ── -->
      ${isAdmin ? `
      <div class="card" style="margin-bottom:1.5rem">
        <div class="secao-titulo">🔧 Ferramentas de manutenção</div>
        <div id="alerta-manutencao"></div>
        <p style="color:#666;font-size:.9rem;margin-bottom:1rem">
          <strong>Recalcular custos de perdas</strong> — atualiza o campo de valor (R$) em todos os
          registros de perda com base no custo atual de cada produto. Use quando o custo foi cadastrado
          depois dos lançamentos ou quando o custo de um produto foi alterado.
        </p>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-secundario" id="btn-recalc-tudo">♻️ Recalcular tudo</button>
          <button class="btn btn-secundario" id="btn-recalc-padaria">🍞 Só Padaria</button>
          <button class="btn btn-secundario" id="btn-recalc-acougue">🥩 Só Açougue</button>
        </div>
      </div>
      ` : ''}

      <!-- ── Seção Motivos (abas) ── -->
      ${podeGerenciarMotivos ? `
      <div class="card">
        <div class="secao-titulo">📌 Motivos de perda</div>

        <div class="tab-nav">
          <button class="tab-btn ativo" data-tab="tab-mot-padaria">🍞 Padaria</button>
          <button class="tab-btn" data-tab="tab-mot-acougue">🥩 Açougue</button>
        </div>

        <!-- Aba Padaria -->
        <div id="tab-mot-padaria" class="tab-content">
          <div id="alerta-motivo-padaria"></div>
          <form id="form-motivo-padaria" style="display:flex;gap:.75rem;align-items:flex-end;max-width:480px;margin-bottom:1.5rem">
            <div class="campo" style="flex:1;margin-bottom:0">
              <label>Novo motivo — Padaria *</label>
              <input type="text" id="m-nome-padaria" placeholder="Ex: Produto vencido" required />
            </div>
            <button type="submit" class="btn btn-primario" id="btn-salvar-mot-padaria">Adicionar</button>
          </form>
          <div class="tabela-wrapper">
            <table>
              <thead><tr><th>Motivo</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                ${motivosPadaria.length
                  ? motivosPadaria.map(linhaMotivo).join('')
                  : '<tr><td colspan="3" class="vazio">Nenhum motivo cadastrado.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Aba Açougue -->
        <div id="tab-mot-acougue" class="tab-content" style="display:none">
          <div id="alerta-motivo-acougue"></div>
          <form id="form-motivo-acougue" style="display:flex;gap:.75rem;align-items:flex-end;max-width:480px;margin-bottom:1.5rem">
            <div class="campo" style="flex:1;margin-bottom:0">
              <label>Novo motivo — Açougue *</label>
              <input type="text" id="m-nome-acougue" placeholder="Ex: Carne fora do prazo" required />
            </div>
            <button type="submit" class="btn btn-primario" id="btn-salvar-mot-acougue">Adicionar</button>
          </form>
          <div class="tabela-wrapper">
            <table>
              <thead><tr><th>Motivo</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                ${motivosAcougue.length
                  ? motivosAcougue.map(linhaMotivo).join('')
                  : '<tr><td colspan="3" class="vazio">Nenhum motivo cadastrado.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    // ── Recalcular custos (admin) ─────────────────────────────────
    if (isAdmin) {
      const bindRecalc = (btnId, secao) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', async () => {
          const alerta = document.getElementById('alerta-manutencao');
          btn.disabled = true;
          btn.textContent = '⏳ Calculando...';
          alerta.innerHTML = '';
          try {
            const res  = await fetch('/api/perdas/recalcular-custos', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(secao ? { secao } : {}),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.erro);
            const label = secao === 'padaria' ? ' (Padaria)' : secao === 'acougue' ? ' (Açougue)' : '';
            alerta.innerHTML = `<div class="alerta alerta-sucesso">✅ ${data.atualizados} registro(s) atualizado(s)${label}.</div>`;
          } catch (err) {
            alerta.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
          } finally {
            btn.disabled = false;
            btn.textContent = btnId === 'btn-recalc-tudo' ? '♻️ Recalcular tudo'
                            : btnId === 'btn-recalc-padaria' ? '🍞 Só Padaria' : '🥩 Só Açougue';
          }
        });
      };
      bindRecalc('btn-recalc-tudo',    null);
      bindRecalc('btn-recalc-padaria', 'padaria');
      bindRecalc('btn-recalc-acougue', 'acougue');
    }

    // ── Navegação entre abas de motivos ──────────────────────────
    if (podeGerenciarMotivos) {
      el.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('ativo'));
          btn.classList.add('ativo');
          el.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
          el.querySelector('#' + btn.dataset.tab).style.display = '';
        });
      });
    }

    // ── Adicionar usuário ────────────────────────────────────────
    if (podeGerenciarUsers) {
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
              nome:   document.getElementById('u-nome').value,
              email:  document.getElementById('u-email').value,
              senha:  document.getElementById('u-senha').value,
              role:   document.getElementById('u-role').value,
              acesso: document.getElementById('u-acesso').value,
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
    }

    // ── Adicionar motivo (fábrica para as duas abas) ─────────────
    if (podeGerenciarMotivos) {
      const bindFormMotivo = (secao) => {
        document.getElementById(`form-motivo-${secao}`).addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn    = document.getElementById(`btn-salvar-mot-${secao}`);
          const alerta = document.getElementById(`alerta-motivo-${secao}`);
          alerta.innerHTML = '';
          btn.disabled = true;
          try {
            const res = await fetch('/api/motivos', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nome:  document.getElementById(`m-nome-${secao}`).value,
                secao,
              }),
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
      };
      bindFormMotivo('padaria');
      bindFormMotivo('acougue');
    }

    // ── Salvar edição de usuário ─────────────────────────────────
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
          nome:   document.getElementById('eu-nome').value,
          email:  document.getElementById('eu-email').value,
          role:   document.getElementById('eu-role').value,
          acesso: document.getElementById('eu-acesso').value,
          ativo:  document.getElementById('eu-ativo').value === 'true',
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

    // ── Salvar permissões ────────────────────────────────────────
    document.getElementById('btn-salvar-perm').addEventListener('click', async () => {
      const btn    = document.getElementById('btn-salvar-perm');
      const alerta = document.getElementById('alerta-perm');
      alerta.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      try {
        const id = document.getElementById('perm-usuario-id').value;
        const permissoes = {};
        Object.keys(window.PERMISSOES_PADRAO).forEach(perm => {
          const cb = document.getElementById(`perm-${perm}`);
          if (cb) permissoes[perm] = cb.checked;
        });
        const res = await fetch(`/api/usuarios/${id}/permissoes`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permissoes),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        fecharModalPermissoes();
        renderConfiguracoes(document.getElementById('conteudo'));
      } catch (err) {
        alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = 'Salvar permissões';
      }
    });

    // ── Salvar edição de motivo ──────────────────────────────────
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

// ── Dropdown de três pontos por usuário ─────────────────────────
let _ddAberto = null;

function toggleDropdownUsuario(id, event) {
  event.stopPropagation();
  const dd  = document.getElementById(`dd-usuario-${id}`);
  const btn = event.currentTarget;
  if (!dd || !btn) return;

  // Fecha qualquer outro dropdown aberto
  if (_ddAberto && _ddAberto !== dd) _ddAberto.classList.remove('aberto');

  const abrindo = !dd.classList.contains('aberto');
  if (abrindo) {
    // Posiciona usando as coordenadas reais do botão (escapa de overflow:hidden)
    const r         = btn.getBoundingClientRect();
    const alturaDD  = 120; // estimativa da altura do dropdown em px
    const sobra     = window.innerHeight - r.bottom;

    dd.style.right = (window.innerWidth - r.right) + 'px';
    dd.style.left  = 'auto';

    if (sobra < alturaDD + 8) {
      // Não cabe abaixo — abre para cima
      dd.style.top    = 'auto';
      dd.style.bottom = (window.innerHeight - r.top + 4) + 'px';
    } else {
      // Cabe abaixo — posição normal
      dd.style.top    = (r.bottom + 4) + 'px';
      dd.style.bottom = 'auto';
    }
  }

  dd.classList.toggle('aberto', abrindo);
  _ddAberto = abrindo ? dd : null;
}

function fecharDropdownUsuario() {
  if (_ddAberto) { _ddAberto.classList.remove('aberto'); _ddAberto = null; }
}

// Fecha dropdown ao clicar em qualquer lugar
document.addEventListener('click', fecharDropdownUsuario);

// ── Ações do dropdown que usam _cfgUsuarios ──────────────────────
function abrirEdicaoUsuarioById(id) {
  fecharDropdownUsuario();
  const u = (window._cfgUsuarios || []).find(x => x.id === id);
  if (!u) return;
  abrirEdicaoUsuario(u.id, u.nome, u.email, u.role, u.acesso, u.ativo);
}

function abrirPermissoesById(id) {
  fecharDropdownUsuario();
  const u = (window._cfgUsuarios || []).find(x => x.id === id);
  if (!u) return;
  abrirPermissoes(u.id, u.nome, u.permissoes, u.role === 'admin');
}

function excluirUsuarioById(id) {
  fecharDropdownUsuario();
  const u = (window._cfgUsuarios || []).find(x => x.id === id);
  if (!u) return;
  excluirUsuario(u.id, u.nome);
}

// ── Usuário: abrir/fechar modal de edição ──────────────────────
function abrirEdicaoUsuario(id, nome, email, role, acesso, ativo) {
  document.getElementById('eu-id').value     = id;
  document.getElementById('eu-nome').value   = nome;
  document.getElementById('eu-email').value  = email;
  document.getElementById('eu-role').value   = role;
  document.getElementById('eu-acesso').value = acesso || 'ambos';
  document.getElementById('eu-ativo').value  = ativo ? 'true' : 'false';
  document.getElementById('eu-senha').value  = '';
  document.getElementById('alerta-edit-usuario').innerHTML = '';
  document.getElementById('btn-salvar-eu').disabled    = false;
  document.getElementById('btn-salvar-eu').textContent = 'Salvar';
  document.getElementById('modal-usuario').style.display = 'flex';
}

function fecharModalUsuario() {
  document.getElementById('modal-usuario').style.display = 'none';
}

// ── Permissões: abrir/fechar modal ──────────────────────────────
function abrirPermissoes(id, nome, permissoesRaw, isAdmin) {
  document.getElementById('perm-usuario-id').value     = id;
  document.getElementById('perm-nome-usuario').textContent = nome;
  document.getElementById('alerta-perm').innerHTML     = '';

  if (isAdmin) {
    document.getElementById('perm-admin-aviso').style.display    = '';
    document.getElementById('perm-checkboxes').style.display     = 'none';
    document.getElementById('btn-salvar-perm').style.display     = 'none';
  } else {
    document.getElementById('perm-admin-aviso').style.display    = 'none';
    document.getElementById('perm-checkboxes').style.display     = '';
    document.getElementById('btn-salvar-perm').style.display     = '';
    document.getElementById('btn-salvar-perm').disabled          = false;
    document.getElementById('btn-salvar-perm').textContent       = 'Salvar permissões';

    // Pré-preenche checkboxes com as permissões efetivas
    const efetivas = { ...window.PERMISSOES_PADRAO, ...(permissoesRaw || {}) };
    Object.keys(window.PERMISSOES_PADRAO).forEach(perm => {
      const cb = document.getElementById(`perm-${perm}`);
      if (cb) cb.checked = !!efetivas[perm];
    });
  }

  document.getElementById('modal-permissoes').style.display = 'flex';
}

function fecharModalPermissoes() {
  document.getElementById('modal-permissoes').style.display = 'none';
}

// ── Motivo: abrir/fechar modal ───────────────────────────────────
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

// ── Excluir usuário ──────────────────────────────────────────────
async function excluirUsuario(id, nome) {
  const ok = await confirmar(
    `Excluir o usuário <strong>"${nome}"</strong>?<br><br>
     Se ele já registrou perdas ou produções, não será possível excluir — use <strong>Editar → Inativo</strong> em vez disso.`,
    { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' }
  );
  if (!ok) return;
  try {
    const res  = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { await alertar(data.erro); return; }
    renderConfiguracoes(document.getElementById('conteudo'));
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}

// ── Excluir motivo ───────────────────────────────────────────────
async function excluirMotivo(id, nome) {
  const ok = await confirmar(
    `Excluir o motivo <strong>"${nome}"</strong>?<br><br>
     Se ele já foi usado em alguma perda registrada, não será possível excluir — use <strong>Editar → Inativo</strong> em vez disso.`,
    { okTexto: '🗑️ Excluir', okClasse: 'btn-perigo' }
  );
  if (!ok) return;
  try {
    const res  = await fetch(`/api/motivos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { await alertar(data.erro); return; }
    renderConfiguracoes(document.getElementById('conteudo'));
  } catch (err) {
    await alertar('Erro ao excluir: ' + err.message);
  }
}
