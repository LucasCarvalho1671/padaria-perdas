// Roteador SPA — troca de páginas sem recarregar o navegador
// Arrow functions garantem que as funções de render só são buscadas
// quando chamadas, não quando este arquivo carrega (os outros scripts
// ainda não existem nesse momento).
const rotas = {
  '/':             { pagina: 'dashboard',     titulo: 'Dashboard',       render: (el) => renderDashboard(el) },
  '/perdas':       { pagina: 'perdas',        titulo: 'Registrar Perda', render: (el) => renderPerdas(el) },
  '/producao':     { pagina: 'producao',      titulo: 'Produção',        render: (el) => renderProducao(el) },
  '/historico':    { pagina: 'historico',     titulo: 'Histórico',       render: (el) => renderHistorico(el) },
  '/produtos':     { pagina: 'produtos',      titulo: 'Produtos',        render: (el) => renderProdutos(el),        apenasAdmin: true },
  '/configuracoes':{ pagina: 'configuracoes', titulo: 'Configurações',   render: (el) => renderConfiguracoes(el),   apenasAdmin: true },
};

function navegar(caminho) {
  history.pushState({}, '', caminho);
  renderPagina(caminho);
}

function renderPagina(caminho) {
  const rota  = rotas[caminho] || rotas['/'];

  // Redireciona funcionários que tentarem acessar páginas admin
  if (rota.apenasAdmin && window.usuarioAtual?.role !== 'admin') {
    history.replaceState({}, '', '/');
    renderPagina('/');
    return;
  }

  const titulo = rota.titulo;

  // Atualiza título do topbar
  document.getElementById('topbar-titulo').textContent = titulo;

  // Marca item ativo no menu
  document.querySelectorAll('.menu-item').forEach(a => {
    a.classList.toggle('ativo', a.dataset.page === rota.pagina);
  });

  // Fecha menu no mobile
  document.getElementById('sidebar').classList.remove('aberto');
  document.getElementById('overlay').classList.remove('visivel');

  // Renderiza o conteúdo
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

  // Renderiza a página inicial
  renderPagina(location.pathname);
}
