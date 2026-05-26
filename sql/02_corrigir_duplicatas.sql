-- ============================================================
-- CORREÇÃO: remove produtos duplicados e adiciona restrição
-- Execute uma única vez no Neon.tech (Query Editor)
-- ============================================================

-- Passo 1: Remove duplicatas mantendo o registro com imagem
-- (se nenhum tiver imagem, mantém o de maior id)
DELETE FROM produtos
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY nome
             ORDER BY
               CASE WHEN imagem_url IS NOT NULL THEN 0 ELSE 1 END,
               id DESC
           ) AS rn
    FROM produtos
  ) t
  WHERE rn > 1
);

-- Passo 2: Adiciona restrição de nome único para evitar duplicatas no futuro
ALTER TABLE produtos
  ADD CONSTRAINT IF NOT EXISTS produtos_nome_unico UNIQUE (nome);
