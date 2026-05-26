// Roteador SPA — troca de páginas sem recarregar o navegador
const rotas = {
  '/':             { pagina: 'dashboard',      titulo: 'Dashboard',        render: renderDashboard },
  '/perdas':       { pagina: 'perdas',         titulo: 'Registrar Perda',  render: renderPerdas },
  '/producao':     { pagina: 'producao',       titulo: 'Produção',         render: renderProducao },
  '/historico':    { pagina: 'historico',      titulo: 'Histórico',        render: renderHistorico },
  '/produtos':     { pagina: 'produtos',       titulo: 'Produtos',         render: renderProdutos },
  '/configuracoes':{ pagina: 'configuracoes',  titulo: 'Configurações',    render: renderConfiguracoes },
};

function navegar(caminho) {
  history.pushState({}, '', caminho);
  renderPagina(caminho);
}

function renderPagina(caminho) {
  const rota  = rotas[caminho] || rotas['/'];
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
