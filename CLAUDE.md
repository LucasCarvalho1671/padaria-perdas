# Padaria Perdas — Contexto do Projeto

## O que é
Sistema de gestão de perdas para padaria. Permite registrar produtos perdidos (por vencimento, furto, produção errada, etc.), produção diária e gera relatórios comparativos e exportação em Excel.

## Stack
- **Backend**: Node.js + Express
- **Banco**: PostgreSQL — Neon.tech
- **Frontend**: HTML + CSS + Vanilla JS (SPA com router próprio)
- **Auth**: JWT em cookie httpOnly (7 dias) + bcrypt
- **Export**: xlsx (planilha Excel)
- **Hospedagem**: Render (backend) + Neon (banco)

## Estrutura de pastas
```
src/
  app.js              → entrada do servidor
  db/
    index.js          → pool de conexão PostgreSQL
    usuarios.js       → queries de usuários
    produtos.js       → queries de produtos
    motivos.js        → queries de motivos de perda
    perdas.js         → queries de perdas + dashboard
    producao.js       → queries de produção + comparativo
  web/
    auth.js           → rotas de login/logout + middleware autenticar()
    routes.js         → todas as rotas da API (/api/...)
    public/
      index.html      → shell do SPA (após login)
      login.html      → tela de login
      app.css         → estilos globais
      router.js       → roteador client-side
      manifest.json   → PWA manifest
      pages/
        dashboard.js  → tela inicial com resumo e comparativo
        perdas.js     → formulário de registro de perda
        producao.js   → formulário de registro de produção
        historico.js  → listagem com filtros e exportação
        produtos.js   → cadastro de produtos
        configuracoes.js → usuários e motivos
  utils/
    helpers.js        → funções utilitárias (formatação, erroInterno)
sql/
  01_criar_tabelas.sql → rodar UMA VEZ no Neon para criar o banco
```

## Variáveis de Ambiente (.env)
```
DATABASE_URL=postgresql://...   # connection string do Neon.tech
JWT_SECRET=...                  # frase secreta para tokens
PORT=3000                       # porta local (Render define automaticamente)
```

## Como rodar localmente
```bash
npm install
cp .env.example .env
# preencher .env com os dados do Neon
node src/app.js
# ou: npm run dev (com nodemon)
```

## Banco de dados
Rodar o arquivo `sql/01_criar_tabelas.sql` no Neon.tech (Query Editor) uma única vez.
Ele cria todas as tabelas e já insere 6 motivos de perda padrão.

## Módulos da API
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET  | /api/auth/me | Usuário logado |
| GET  | /api/produtos | Listar produtos |
| POST | /api/produtos | Cadastrar produto |
| PUT  | /api/produtos/:id | Editar produto |
| GET  | /api/motivos | Listar motivos |
| POST | /api/motivos | Cadastrar motivo |
| PUT  | /api/motivos/:id | Editar motivo |
| POST | /api/perdas | Registrar perda |
| GET  | /api/perdas | Listar perdas (com filtros) |
| DELETE | /api/perdas/:id | Excluir perda |
| POST | /api/producao | Registrar produção |
| GET  | /api/producao | Listar produção |
| DELETE | /api/producao/:id | Excluir produção |
| GET  | /api/dashboard | Dados do dashboard |
| GET  | /api/relatorio/exportar | Exportar Excel |
| GET  | /api/usuarios | Listar usuários |
| POST | /api/usuarios | Criar usuário |
| PUT  | /api/usuarios/:id | Editar usuário |

## Decisões de projeto
- Sem framework de frontend (Vanilla JS) — mesmo padrão do gestor-financeiro
- role de usuário já existe no banco (admin/funcionario) mas não é validado ainda — preparado para o futuro
- Custo do produto é opcional — se não tiver, o valor da perda fica em branco
- Unidade de medida é por produto (unidade, kg, litro, etc.)
