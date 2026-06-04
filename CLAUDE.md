# Padaria Perdas — Contexto do Projeto

## O que é
Sistema de gestão de perdas para padaria e açougue. Permite registrar produtos perdidos
(por vencimento, furto, produção errada, etc.), produção diária, gera relatórios
comparativos, exportação em CSV e controle de cobranças por negligência.

## Hospedagem real (produção)
- **VPS**: 2.25.136.130 (root / Luc@s415241VPS)
- **Caminho**: `/var/www/padaria`
- **Processo**: PM2 — `pm2 restart padaria`
- **Porta**: 3001 (Nginx faz proxy reverso com SSL)
- **Banco**: PostgreSQL local na VPS — banco `padaria_db`
- **Deploy**: `py -3 deploy.py` na raiz do projeto local

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
      produtos.js       → queries de produtos (custo + valor_cobranca)
      motivos.js        → queries de motivos (cobrar_negligencia)
      perdas.js         → queries de perdas + dashboard + recalcularCustos
      producao.js       → queries de produção + comparativo
      funcionarios.js   → queries de funcionários cobrados por negligência
    web/
      auth.js           → login/logout + PERMISSOES_PADRAO + verificarPermissao()
      routes.js         → todas as rotas da API (/api/...)
      public/
        index.html      → shell do SPA (após login) + temPermissao() global
        login.html      → tela de login
        app.css         → estilos globais (inclui mobile, dp-*, dg-*)
        router.js       → roteador client-side com controle de permissões
        pages/
          dashboard.js       → resumo clicável + navega para histórico com filtros
          dashboard-geral.js → visão geral lado a lado (padaria + açougue)
          perdas.js          → formulário de registro de perda + seção de cobrança
          producao.js        → listagem + edição + exclusão de produção
          historico.js       → listagem + modal detalhe + edição + exclusão
          produtos.js        → cadastro de produtos com imagem + valor_cobranca
          configuracoes.js   → usuários, motivos, funcionários, permissões, manutenção
          funcionarios.js    → seção de funcionários (chamada pelo configuracoes.js)
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

## Banco de dados — schema completo

### Tabelas principais
```sql
usuarios     (id, nome, email, senha, role, acesso, ativo, permissoes JSONB, criado_em)
produtos     (id, nome, unidade, custo, valor_cobranca, imagem_url, favorito, ativo, secao, criado_em)
motivos      (id, nome, cobrar_negligencia BOOLEAN, ativo, secao, criado_em)
funcionarios (id, nome, funcao, secao, ativo, criado_em)
perdas       (id, produto_id, motivo_id, quantidade, valor_total, data, observacao,
              usuario_id, secao, funcionario_cobrado_id, valor_cobrado, criado_em)
producao     (id, produto_id, quantidade, data, observacao, usuario_id, secao, criado_em)
```

### Migrações já aplicadas na VPS
```sql
ALTER TABLE usuarios  ADD COLUMN permissoes JSONB;
ALTER TABLE produtos  ADD COLUMN favorito BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos  ADD COLUMN secao VARCHAR(20) DEFAULT 'padaria';
ALTER TABLE produtos  ADD COLUMN valor_cobranca NUMERIC(10,2);
ALTER TABLE motivos   ADD COLUMN secao VARCHAR(20) DEFAULT 'padaria';
ALTER TABLE motivos   ADD COLUMN cobrar_negligencia BOOLEAN DEFAULT FALSE;
ALTER TABLE perdas    ADD COLUMN secao VARCHAR(20) DEFAULT 'padaria';
ALTER TABLE perdas    ADD COLUMN funcionario_cobrado_id INTEGER REFERENCES funcionarios(id);
ALTER TABLE perdas    ADD COLUMN valor_cobrado NUMERIC(10,2);
CREATE TABLE funcionarios (...);
```

## Sistema de Permissões (15 permissões granulares)

### PERMISSOES_PADRAO (auth.js e index.html — manter sincronizados)
```js
{
  ver_dashboard: true,        ver_historico: true,
  registrar_perda: true,      registrar_producao: true,
  editar_perda: false,        excluir_perda: false,
  editar_producao: false,     excluir_producao: false,
  exportar_relatorio: true,
  cadastrar_produto: false,   editar_produto: false,   excluir_produto: false,
  gerenciar_motivos: false,   gerenciar_usuarios: false,
  gerenciar_funcionarios: false,
}
```
- Coluna `permissoes` JSONB na tabela `usuarios`
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
| GET  | /api/funcionarios | autenticar | Listar funcionários |
| POST | /api/funcionarios | gerenciar_funcionarios | Criar funcionário |
| PUT  | /api/funcionarios/:id | gerenciar_funcionarios | Editar funcionário |
| DELETE | /api/funcionarios/:id | gerenciar_funcionarios | Excluir funcionário |
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

### Dashboard Geral (`/dashboard-geral`)
- Tela inicial para usuários com `acesso: 'ambos'` + `ver_dashboard`
- Duas colunas sempre lado a lado (padaria | açougue), inclusive no mobile
- Cada coluna: header clicável → dashboard individual, 4 mini-cards, top produtos, por motivo
- Cada mini-card: ícone no canto → dashboard individual; corpo → histórico filtrado
- `acessoRequerido: 'ambos'` na rota — usuários com só padaria ou só açougue são bloqueados

### Dashboard individual
- 4 cards clicáveis (perdas do mês, valor perdido, semana, total histórico)
- Tabelas clicáveis: top produtos, por motivo, comparativo produção × perda
- Navegação para histórico com filtros via `window._historicoFiltros`

### Histórico de perdas
- Filtros: data início/fim, produto (combobox), motivo, cobrado de (funcionário)
- Totalizador: N registros · X kg · R$ valor · ⚠️ R$ cobrado (chip vermelho)
- **Tabela simplificada**: Data, Produto, Qtd, Valor, Motivo (badge ⚠️ se tem cobrança)
- **Clicar na linha** → modal de detalhe completo (imagem, todos os campos, cobrança, obs.)
- Editar/excluir: na tabela E no modal de detalhe (apenas para quem tem permissão)
- Exportar CSV (requer `exportar_relatorio`)

### Registrar Perda
- Seção de cobrança por negligência (aparece automaticamente quando motivo tem flag)
- Seleciona funcionário responsável + valor cobrado (calculado por `produto.valor_cobranca × qtd`)
- Validação: funcionário obrigatório quando motivo cobra negligência

### Produção
- Listagem com filtros, edição e exclusão por permissão
- Exportar CSV

### Produtos
- `custo` → valor para cálculo de `valor_total` da perda
- `valor_cobranca` → valor cobrado do funcionário por negligência (pode ser diferente do custo)
- Cadastro com busca automática de imagem (Wikipedia → Google → Pixabay)
- Toggle favorito (aparecem primeiro nos filtros com ★)

### Configurações
- **Usuários**: cadastrar, editar, ativar/inativar, excluir, dropdown ⋯ com `position:fixed`
- **Permissões**: modal com 15 checkboxes por usuário (só admin)
- **Motivos**: separados por aba (Padaria / Açougue) + flag "Cobra por negligência"
  - Badge `⚠️ cobra` na tabela de motivos quando flag ativa
- **👷 Funcionários**: cadastrar/editar/inativar/excluir funcionários cobráveis
  - Tabela com Nome, Cargo, Seção, Situação
  - Independentes dos usuários do sistema (não têm login)
- **Ferramentas de manutenção** (só admin):
  - Recalcular custos: atualiza `valor_total` e `valor_cobrado` com base nos custos atuais
  - Produto sem custo → limpa o valor (NULL)

### Seções Padaria / Açougue
- Todos os cadastros têm campo `secao` ('padaria' ou 'acougue')
- Rotas separadas: `/historico` vs `/acougue/historico`, etc.
- Funcionários filtrados por seção na tela de registro de perda

## Padrões importantes

### Roteamento
```js
rotaDefault():
  acesso='ambos' + ver_dashboard → '/dashboard-geral'
  acesso='acougue'               → '/acougue'
  default                        → '/'

podeAcessarRota(rota):
  admin → sempre passa
  rota.acessoRequerido && u.acesso !== rota.acessoRequerido → bloqueia
  rota.permissoes → verifica temPermissao()
```

### Navegação dashboard → histórico
```js
window._historicoFiltros = { dataInicio, dataFim, produto_id, motivo_id };
navegar('/historico'); // ou /acougue/historico
// historico.js lê e limpa _historicoFiltros no início do render
```

### Cobrança por negligência — fluxo completo
1. Motivo marcado com `cobrar_negligencia = true` em Configurações
2. Produto com `valor_cobranca` cadastrado em Produtos
3. Ao registrar perda: seção laranja aparece → seleciona funcionário → valor calculado automaticamente
4. `perdas.funcionario_cobrado_id` + `perdas.valor_cobrado` salvos no banco
5. Histórico: badge ⚠️ na linha + detalhes no modal de detalhe
6. Filtro "Cobrado de" no histórico (por funcionário ou "apenas com cobrança")

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

### Inicialização do configuracoes.js
- `renderSecaoFuncionarios` é chamado por ÚLTIMO (após todos os listeners)
- Envolto em try/catch para não quebrar o resto se falhar
- Ordem importante: tabs → add usuario → bindFormMotivo → save usuario → save permissoes → save motivo → **renderSecaoFuncionarios**

## Mobile (app.css)
- Sidebar deslizante com overlay
- Filtros em coluna com `width: 100%`
- `input[type="date"]` com `-webkit-appearance: none` + padding explícito + `min-height: 2.7rem`
- Cards do dashboard: `.card-resumo .label { min-height: 2.4rem }` para alinhar títulos
- Dashboard geral: `.dg-mini-grid { grid-template-columns: 1fr }` no mobile (cards empilhados)

## Deploy — arquivos monitorados
Todos os arquivos abaixo estão em `deploy.py`. Se criar arquivo novo, adicionar lá:
```
src/db/: usuarios, funcionarios, motivos, perdas, producao, produtos
src/web/: auth, routes
src/web/public/: index.html, app.css, router.js
src/web/public/pages/: configuracoes, funcionarios, dashboard, dashboard-geral,
                        perdas, historico, producao, produtos
```
