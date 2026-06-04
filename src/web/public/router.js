// Roteador SPA — troca de páginas sem recarregar o navegador
// Arrow functions garantem que as funções de render só são buscadas
// quando chamadas, não quando este arquivo carrega (os outros scripts
// ainda não existem nesse momento).
const rotas = {
  // ── Padaria ───────────────────────────────────────────────────
  '/':                  { pagina: 'dashboard',         secao: 'padaria', titulo: 'Dashboard',       render: (el) => renderDashboard(el) },
  '/perdas':            { pagina: 'perdas',             secao: 'padaria', titulo: 'Registrar Perda', render: (el) => renderPerdas(el) },
  '/producao':          { pagina: 'producao',           secao: 'padaria', titulo: 'Produção',        render: (el) => renderProducao(el) },
  '/historico':         { pagina: 'historico',          secao: 'padaria', titulo: 'Histórico',       render: (el) => renderHistorico(el) },
  '/produtos':          { pagina: 'produtos',           secao: 'padaria', titulo: 'Produtos',        render: (el) => renderProdutos(el),           permissoes: ['cadastrar_produto', 'editar_produto', 'excluir_produto'] },
  // ── Açougue ───────────────────────────────────────────────────
  '/acougue':           { pagina: 'acougue-dashboard',  secao: 'acougue', titulo: 'Dashboard',       render: (el) => renderDashboard(el,  'acougue') },
  '/acougue/perdas':    { pagina: 'acougue-perdas',     secao: 'acougue', titulo: 'Registrar Perda', render: (el) => renderPerdas(el,     'acougue') },
  '/acougue/producao':  { pagina: 'acougue-producao',   secao: 'acougue', titulo: 'Produção',        render: (el) => renderProducao(el,   'acougue') },
  '/acougue/historico': { pagina: 'acougue-historico',  secao: 'acougue', titulo: 'Histórico',       render: (el) => renderHistorico(el,  'acougue') },
  '/acougue/produtos':  { pagina: 'acougue-produtos',   secao: 'acougue', titulo: 'Produtos',        render: (el) => renderProdutos(el,   'acougue'), permissoes: ['cadastrar_produto', 'editar_produto', 'excluir_produto'] },
  // ── Geral ─────────────────────────────────────────────────────
  '/dashboard-geral':   { pagina: 'dashboard-geral',    secao: 'geral',   titulo: 'Dashboard Geral', render: (el) => renderDashboardGeral(el), permissoes: ['ver_dashboard'], acessoRequerido: 'ambos' },
  '/configuracoes':     { pagina: 'configuracoes',      secao: 'geral',   titulo: 'Configurações',   render: (el) => renderConfiguracoes(el),       permissoes: ['gerenciar_motivos', 'gerenciar_usuarios'] },
};

// Rota padrão para o acesso do usuário
function rotaDefault() {
  const u      = window.usuarioAtual;
  const acesso = u?.acesso || 'ambos';
  // Usuário com acesso a ambas seções e permissão de ver dashboard → Dashboard Geral
  if (acesso === 'ambos' && temPermissao('ver_dashboard')) return '/dashboard-geral';
  if (acesso === 'acougue') return '/acougue';
  return '/';
}

// Verifica se o usuário tem permissão para acessar a rota
function podeAcessarRota(rota) {
  const u = window.usuarioAtual;
  if (!u) return false;
  if (u.role === 'admin') return true;          // admin passa em tudo
  if (rota.acessoRequerido && u.acesso !== rota.acessoRequerido) return false; // ex: só 'ambos'
  if (!rota.permissoes) return true;            // rota sem restrição de permissão
  return rota.permissoes.some(p => temPermissao(p)); // precisa de ao menos uma
}

function navegar(caminho) {
  history.pushState({}, '', caminho);
  renderPagina(caminho);
}

function renderPagina(caminho) {
  const rota   = rotas[caminho] || rotas[rotaDefault()];
  const acesso = window.usuarioAtual?.acesso || 'ambos';

  // ── Bloqueia seção não autorizada ────────────────────────────
  if (rota.secao === 'padaria' && acesso === 'acougue') {
    history.replaceState({}, '', '/acougue');
    renderPagina('/acougue');
    return;
  }
  if (rota.secao === 'acougue' && acesso === 'padaria') {
    history.replaceState({}, '', '/');
    renderPagina('/');
    return;
  }

  // ── Bloqueia páginas sem permissão ────────────────────────────
  if (!podeAcessarRota(rota)) {
    const fallback = rotaDefault();
    history.replaceState({}, '', fallback);
    renderPagina(fallback);
    return;
  }

  // ── Atualiza título do topbar ─────────────────────────────────
  document.getElementById('topbar-titulo').textContent = rota.titulo;

  // ── Marca item ativo no menu ──────────────────────────────────
  document.querySelectorAll('.menu-item').forEach(a => {
    a.classList.toggle('ativo', a.dataset.page === rota.pagina);
  });

  // ── Fecha menu no mobile ──────────────────────────────────────
  document.getElementById('sidebar').classList.remove('aberto');
  document.getElementById('overlay').classList.remove('visivel');

  // ── Renderiza o conteúdo ──────────────────────────────────────
  rota.render(document.getElementById('conteudo'));
}

function initRouter() {
  // Intercepta cliques em links do menu
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navegar(link.getAttribute('href'));
    });
  });

  // Botão voltar/avançar do navegador
  window.addEventListener('popstate', () => renderPagina(location.pathname));

  // Rota inicial: redireciona '/' para a rota padrão do usuário
  let inicio = location.pathname;
  if (inicio === '/') {
    inicio = rotaDefault();
    history.replaceState({}, '', inicio);
  }
  renderPagina(inicio);
}
