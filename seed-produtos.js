// seed-produtos.js — Cadastra produtos padrão de padaria
// Rodar com: node seed-produtos.js
// Pode rodar mais de uma vez sem duplicar (usa ON CONFLICT DO NOTHING)

require('dotenv').config();
const db = require('./src/db/index');

const produtos = [
  // ── PÃES ──────────────────────────────────────────────────
  { nome: 'Pão Francês',           unidade: 'unidade' },
  { nome: 'Pão de Queijo',         unidade: 'unidade' },
  { nome: 'Pão Integral',          unidade: 'unidade' },
  { nome: 'Pão de Forma',          unidade: 'pacote'  },
  { nome: 'Pão Sírio',             unidade: 'pacote'  },
  { nome: 'Pão de Hot Dog',        unidade: 'unidade' },
  { nome: 'Pão de Hambúrguer',     unidade: 'unidade' },
  { nome: 'Baguete',               unidade: 'unidade' },
  { nome: 'Croissant',             unidade: 'unidade' },
  { nome: 'Rosca Doce',            unidade: 'unidade' },
  { nome: 'Broa de Milho',         unidade: 'unidade' },
  { nome: 'Pão de Batata',         unidade: 'unidade' },
  { nome: 'Pão Sovado',            unidade: 'unidade' },
  { nome: 'Pão de Leite',          unidade: 'unidade' },

  // ── SALGADOS ──────────────────────────────────────────────
  { nome: 'Coxinha',               unidade: 'unidade' },
  { nome: 'Empada',                unidade: 'unidade' },
  { nome: 'Esfiha',                unidade: 'unidade' },
  { nome: 'Quibe',                 unidade: 'unidade' },
  { nome: 'Pastel',                unidade: 'unidade' },
  { nome: 'Enroladinho de Salsicha', unidade: 'unidade' },
  { nome: 'Pão de Batata Recheado', unidade: 'unidade' },
  { nome: 'Torta Salgada',         unidade: 'fatia'   },

  // ── BOLOS E DOCES ─────────────────────────────────────────
  { nome: 'Bolo de Chocolate',     unidade: 'fatia'   },
  { nome: 'Bolo de Cenoura',       unidade: 'fatia'   },
  { nome: 'Bolo de Laranja',       unidade: 'fatia'   },
  { nome: 'Bolo de Fubá',          unidade: 'fatia'   },
  { nome: 'Bolo de Coco',          unidade: 'fatia'   },
  { nome: 'Sonho',                 unidade: 'unidade' },
  { nome: 'Brigadeiro',            unidade: 'unidade' },
  { nome: 'Palha Italiana',        unidade: 'unidade' },
  { nome: 'Pão de Mel',            unidade: 'unidade' },
  { nome: 'Cuca',                  unidade: 'fatia'   },
];

(async () => {
  console.log('🥖 Cadastrando produtos...\n');
  let inseridos = 0;

  for (const p of produtos) {
    try {
      const { rowCount } = await db.query(
        `INSERT INTO produtos (nome, unidade)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [p.nome, p.unidade]
      );
      if (rowCount > 0) {
        console.log(`  ✅ ${p.nome} (${p.unidade})`);
        inseridos++;
      } else {
        console.log(`  ⏭  ${p.nome} — já existia`);
      }
    } catch (err) {
      console.log(`  ❌ ${p.nome} — erro: ${err.message}`);
    }
  }

  console.log(`\n🎉 Pronto! ${inseridos} produtos cadastrados.`);
  console.log('💡 Você pode editar custos e adicionar imagens pelo app.\n');
  process.exit(0);
})();
