-- ============================================================
-- SISTEMA DE GESTÃO DE PERDAS - PADARIA
-- Execute este arquivo uma única vez no Neon.tech
-- ============================================================

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha       VARCHAR(255) NOT NULL,             -- armazenada com bcrypt
  role        VARCHAR(20)  NOT NULL DEFAULT 'funcionario', -- 'admin' ou 'funcionario'
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de produtos cadastrados
CREATE TABLE IF NOT EXISTS produtos (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  unidade     VARCHAR(20)  NOT NULL DEFAULT 'unidade', -- unidade, kg, g, litro, ml, etc.
  custo       NUMERIC(10,2),                           -- custo unitário (opcional)
  imagem_url  VARCHAR(500),                            -- URL da imagem de referência
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de motivos de perda (personalizável)
CREATE TABLE IF NOT EXISTS motivos (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de registros de perda
CREATE TABLE IF NOT EXISTS perdas (
  id          SERIAL PRIMARY KEY,
  produto_id  INTEGER      NOT NULL REFERENCES produtos(id),
  motivo_id   INTEGER      NOT NULL REFERENCES motivos(id),
  quantidade  NUMERIC(10,3) NOT NULL,
  valor_total NUMERIC(10,2),                           -- calculado: quantidade * produto.custo
  data        DATE         NOT NULL,
  observacao  TEXT,
  usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id),
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de registros de produção
CREATE TABLE IF NOT EXISTS producao (
  id          SERIAL PRIMARY KEY,
  produto_id  INTEGER      NOT NULL REFERENCES produtos(id),
  quantidade  NUMERIC(10,3) NOT NULL,
  data        DATE         NOT NULL,
  observacao  TEXT,
  usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id),
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_perdas_data       ON perdas(data);
CREATE INDEX IF NOT EXISTS idx_perdas_produto    ON perdas(produto_id);
CREATE INDEX IF NOT EXISTS idx_perdas_motivo     ON perdas(motivo_id);
CREATE INDEX IF NOT EXISTS idx_producao_data     ON producao(data);
CREATE INDEX IF NOT EXISTS idx_producao_produto  ON producao(produto_id);

-- ============================================================
-- DADOS INICIAIS - Motivos padrão de perda
-- ============================================================
INSERT INTO motivos (nome) VALUES
  ('Vencimento'),
  ('Produto queimado'),
  ('Produto amassado'),
  ('Furto'),
  ('Erro de produção'),
  ('Sobra do dia')
ON CONFLICT DO NOTHING;
