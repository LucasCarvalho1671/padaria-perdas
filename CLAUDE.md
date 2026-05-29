# Padaria Perdas — Contexto do Projeto

## O que é
Sistema de gestão de perdas para padaria e açougue. Permite registrar produtos perdidos
(por vencimento, furto, produção errada, etc.), produção diária, gera relatórios
comparativos e exportação em CSV (Excel).

## Hospedagem real (produção)
- **VPS**: 2.25.136.130 (root / Luc@s415241VPS)
- **Caminho**: `/var/www/padaria`
- **Processo**: PM2 — `pm2 restart padaria`
- **Porta**: 3001 (Nginx faz proxy reverso com SSL)
- **Banco**: PostgreSQL local na VPS — banco `padaria_db`
- **Deploy**: `py -3 deploy.py` na raiz do projeto local

> O CLAUDE.md original mencionava Render + Neon — isso foi migrado para VPS própria.

## Stack
- **Backend**: Node.js + Express
- **Banco**: PostgreSQL (local na VPS)
- **Frontend**: HTML + CSS + Vanilla JS (SPA com router próprio)
- **Auth**: JWT em cookie httpOnly (7 dias) + bcrypt
- **Export**: CSV gerado no backend (abre no Excel)
- **Deploy**: Python + paramiko (`deploy.py`)

## Estrutura de pastas
```
app/
  src/
    app.js              → entrada do servidor (porta 3001)
    db/
      index.js          → pool de conexão PostgreSQL
      usuarios.js       → queries de usuários + permissões
      produtos.js       → queries de produtos
      motivos.js        → queries de motivos de perda
      perdas.js         → queries de perdas + dashboard + recalcularCustos
      producao.js       → queries de produção + comparativo
    web/
      auth.js           → login/logout + PERMISSOES_PADRAO + verificarPermissao()
      routes.js         → todas as rotas da API (/api/...)
      public/
        index.html      → shell do SPA (após login) + temPermissao() global
        login.html      → tela de login
        app.css         → estilos globais (inclui mobile)
        router.js       → roteador client-side com controle de permissões
        pages/
          dashboard.js  → resumo clicável + navega para histórico com filtros
          perdas.js     → formulário de registro de perda
          producao.js   → listagem + edição + exclusão de produção
          historico.js  → listagem com filtros, edição e exclusão de perdas
          produtos.js   → cadastro de produtos com imagem
          configuracoes.js → usuários, motivos, permissões e ferramentas de manutenção
    utils/
      helpers.js        → erroInterno()
  sql/
    01_criar_tabelas.sql → estrutura inicial do banco
deploy.py               → envia arquivos para VPS via SFTP e reinicia PM2
```

## Variáveis de Ambiente (.env na VPS)
```
DATABASE_URL=postgresql://...   # connection string local
JWT_SECRET=...
PORT=3001
```

## Sistema de Permissões (14 permissões granulares)

### PERMISSOES_PADRAO (auth.js e index.html)
```js
{
  ver_dashboard: true,       ver_historico: true,
  registrar_perda: true,     registrar_producao: true,
  editar_perda: false,       excluir_perda: false,
  editar_producao: false,    excluir_producao: false,
  exportar_relatorio: true,
  cadastrar_produto: false,  editar_produto: false,  excluir_produto: false,
  gerenciar_motivos: false,  gerenciar_usuarios: false,
}
```
- Coluna `permissoes` JSONB na tabela `usuarios` (migrado na VPS)
- Admin sempre passa — `verificarPermissao()` só verifica funcionários
- `temPermissao(perm)` global no frontend (via `window.usuarioAtual`)
- JWT inclui permissões efetivas (padrão + overrides do usuário)

## Módulos da API
| Método | Rota | Proteção | Descrição |
|--------|------|----------|-----------|
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | — | Logout |
| GET  | /api/auth/me | autenticar | Usuário logado |
| GET  | /api/produtos | autenticar | Listar produtos |
| POST | /api/produtos | cadastrar_produto | Criar produto |
| PUT  | /api/produtos/:id | editar_produto | Editar produto |
| DELETE | /api/produtos/:id | excluir_produto | Excluir produto |
| PATCH | /api/produtos/:id/favorito | editar_produto | Toggle favorito |
| GET  | /api/motivos | autenticar | Listar motivos |
| POST | /api/motivos | gerenciar_motivos | Criar motivo |
| PUT  | /api/motivos/:id | gerenciar_motivos | Editar motivo |
| DELETE | /api/motivos/:id | gerenciar_motivos | Excluir motivo |
| POST | /api/perdas | autenticar | Registrar perda |
| GET  | /api/perdas | autenticar | Listar perdas (filtros) |
| PUT  | /api/perdas/:id | editar_perda | Editar perda |
| DELETE | /api/perdas/:id | excluir_perda | Excluir perda |
| POST | /api/perdas/recalcular-custos | apenasAdmin | Recalcular valor_total |
| POST | /api/producao | autenticar | Registrar produção |
| GET  | /api/producao | autenticar | Listar produção (filtros) |
| PUT  | /api/producao/:id | editar_producao | Editar produção |
| DELETE | /api/producao/:id | excluir_producao | Excluir produção |
| GET  | /api/dashboard | autenticar | Dados do dashboard |
| GET  | /api/relatorio/exportar | exportar_relatorio | Exportar CSV |
| GET  | /api/imagens/buscar | autenticar | Buscar imagens (Wikipedia/Google/Pixabay) |
| GET  | /api/usuarios | gerenciar_usuarios | Listar usuários |
| POST | /api/usuarios | gerenciar_usuarios | Criar usuário |
| PUT  | /api/usuarios/:id | gerenciar_usuarios | Editar usuário |
| DELETE | /api/usuarios/:id | gerenciar_usuarios | Excluir usuário |
| PUT  | /api/usuarios/:id/permissoes | apenasAdmin | Alterar permissões |

## Funcionalidades implementadas

### Dashboard
- 4 cards clicáveis (perdas do mês, valor perdido, semana, total histórico)
- Tabelas clicáveis: top produtos perdidos, perdas por motivo, comparativo produção × perda
- Clicar navega para Histórico com filtros pré-aplicados via `window._historicoFiltros`

### Histórico de perdas
- Filtros: data início/fim, produto (combobox pesquisável), motivo
- Totalizador: N registros · X kg · Y unid · R$ Z (valor em verde)
- Edição inline via modal (requer permissão `editar_perda`)
- Exclusão (requer permissão `excluir_perda`)
- Exportar CSV (requer permissão `exportar_relatorio`)

### Produção
- Listagem com filtros, edição e exclusão por permissão
- Exportar CSV

### Produtos
- Cadastro com busca automática de imagem (Wikipedia → Google → Pixabay)
- Toggle favorito (aparecem primeiro nos filtros com ★)
- Inativar em vez de excluir quando há registros vinculados

### Configurações (admin/permissão)
- **Usuários**: cadastrar, editar, ativar/inativar, excluir
- **Permissões**: modal com 14 checkboxes por usuário (só admin)
- **Motivos**: separados por aba (Padaria / Açougue)
- **Ferramentas de manutenção** (só admin):
  - Recalcular custos de perdas — atualiza `valor_total` com base no custo atual do produto
  - Produto sem custo → limpa o valor (NULL); com custo → recalcula

### Seções Padaria / Açougue
- Todos os cadastros têm campo `secao` ('padaria' ou 'acougue')
- Rotas separadas no router: /historico vs /acougue/historico, etc.

## Padrões importantes

### Dropdown de 3 pontos (configuracoes.js)
- `position: fixed` + `getBoundingClientRect()` para escapar de overflow:hidden
- Abre para cima se menos de 120px disponíveis abaixo

### Navegação dashboard → histórico
```js
window._historicoFiltros = { dataInicio, dataFim, produto_id, motivo_id };
navegar('/historico'); // ou /acougue/historico
// historico.js lê e limpa window._historicoFiltros no início do render
```

### Recálculo de custos (SQL)
```sql
UPDATE perdas p
SET valor_total = CASE
  WHEN pr.custo IS NOT NULL AND pr.custo > 0 THEN p.quantidade * pr.custo
  ELSE NULL
END
FROM produtos pr
WHERE p.produto_id = pr.id
[AND p.secao = $1]
```

## Mobile (app.css)
- Sidebar deslizante com overlay
- Filtros em coluna com `width: 100%`
- `input[type="date"]` com `-webkit-appearance: none` + padding explícito + `min-height: 2.7rem` para evitar overflow no iOS e manter tamanho uniforme vazio/preenchido
- Cards do dashboard: `.card-resumo .label { min-height: 2.4rem }` para alinhar os valores mesmo quando o título ocupa 2 linhas
