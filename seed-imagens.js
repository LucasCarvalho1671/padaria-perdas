// seed-imagens.js — Busca imagem principal de artigos do Wikipedia (REST API)
// Rodar com: node seed-imagens.js
// Requer Node.js 18+

require('dotenv').config();
const db = require('./src/db/index');

// Para cada produto: lista de tentativas em ordem de preferência
// lang: 'pt' = Wikipedia PT | 'en' = Wikipedia EN
// titulo: título exato do artigo no Wikipedia
const mapeamento = [
  // ── PÃES ──────────────────────────────────────────────────
  { nome: 'Pão Francês',
    tentativas: [{ lang: 'pt', titulo: 'Pão francês' }, { lang: 'en', titulo: 'Bread roll' }] },

  { nome: 'Pão de Queijo',
    tentativas: [{ lang: 'pt', titulo: 'Pão de queijo' }, { lang: 'en', titulo: 'Cheese bread' }] },

  { nome: 'Pão Integral',
    tentativas: [{ lang: 'en', titulo: 'Whole wheat bread' }, { lang: 'pt', titulo: 'Pão integral' }] },

  { nome: 'Pão de Forma',
    tentativas: [{ lang: 'en', titulo: 'Sliced bread' }, { lang: 'pt', titulo: 'Pão de forma' }] },

  { nome: 'Pão Sírio',
    tentativas: [{ lang: 'en', titulo: 'Pita' }, { lang: 'pt', titulo: 'Pão sírio' }] },

  { nome: 'Pão de Hot Dog',
    tentativas: [{ lang: 'en', titulo: 'Hot dog bun' }, { lang: 'en', titulo: 'Hot dog' }] },

  { nome: 'Pão de Hambúrguer',
    tentativas: [{ lang: 'en', titulo: 'Hamburger' }, { lang: 'en', titulo: 'Bun' }] },

  { nome: 'Baguete',
    tentativas: [{ lang: 'pt', titulo: 'Baguete' }, { lang: 'en', titulo: 'Baguette' }] },

  { nome: 'Croissant',
    tentativas: [{ lang: 'pt', titulo: 'Croissant' }, { lang: 'en', titulo: 'Croissant' }] },

  { nome: 'Rosca Doce',
    tentativas: [{ lang: 'en', titulo: 'Cinnamon roll' }, { lang: 'en', titulo: 'Sweet roll' }] },

  { nome: 'Broa de Milho',
    tentativas: [{ lang: 'en', titulo: 'Cornbread' }, { lang: 'pt', titulo: 'Broa' }] },

  { nome: 'Pão de Batata',
    tentativas: [{ lang: 'en', titulo: 'Potato bread' }, { lang: 'pt', titulo: 'Pão de batata' }] },

  { nome: 'Pão Sovado',
    tentativas: [{ lang: 'en', titulo: 'Bread roll' }, { lang: 'en', titulo: 'Dinner roll' }] },

  { nome: 'Pão de Leite',
    tentativas: [{ lang: 'en', titulo: 'Milk bread' }, { lang: 'en', titulo: 'Hokkaido bread' }] },

  // ── SALGADOS ──────────────────────────────────────────────
  { nome: 'Coxinha',
    tentativas: [{ lang: 'pt', titulo: 'Coxinha' }, { lang: 'en', titulo: 'Coxinha' }] },

  { nome: 'Empada',
    tentativas: [{ lang: 'pt', titulo: 'Empada' }, { lang: 'en', titulo: 'Empanada' }] },

  { nome: 'Esfiha',
    tentativas: [{ lang: 'pt', titulo: 'Esfiha' }, { lang: 'en', titulo: 'Sfiha' }] },

  { nome: 'Quibe',
    tentativas: [{ lang: 'pt', titulo: 'Quibe' }, { lang: 'en', titulo: 'Kibbeh' }] },

  { nome: 'Pastel',
    tentativas: [{ lang: 'pt', titulo: 'Pastel (culinária)' }, { lang: 'en', titulo: 'Pastel (food)' }] },

  { nome: 'Enroladinho de Salsicha',
    tentativas: [{ lang: 'en', titulo: 'Sausage roll' }, { lang: 'en', titulo: 'Pigs in blankets' }] },

  { nome: 'Pão de Batata Recheado',
    tentativas: [{ lang: 'en', titulo: 'Stuffed bread' }, { lang: 'en', titulo: 'Bread roll' }] },

  { nome: 'Torta Salgada',
    tentativas: [{ lang: 'en', titulo: 'Quiche' }, { lang: 'en', titulo: 'Savory pie' }] },

  // ── BOLOS E DOCES ─────────────────────────────────────────
  { nome: 'Bolo de Chocolate',
    tentativas: [{ lang: 'pt', titulo: 'Bolo de chocolate' }, { lang: 'en', titulo: 'Chocolate cake' }] },

  { nome: 'Bolo de Cenoura',
    tentativas: [{ lang: 'pt', titulo: 'Bolo de cenoura' }, { lang: 'en', titulo: 'Carrot cake' }] },

  { nome: 'Bolo de Laranja',
    tentativas: [{ lang: 'en', titulo: 'Orange cake' }, { lang: 'en', titulo: 'Pound cake' }] },

  { nome: 'Bolo de Fubá',
    tentativas: [{ lang: 'pt', titulo: 'Bolo de fubá' }, { lang: 'en', titulo: 'Cornmeal' }] },

  { nome: 'Bolo de Coco',
    tentativas: [{ lang: 'en', titulo: 'Coconut cake' }, { lang: 'en', titulo: 'Coconut' }] },

  { nome: 'Sonho',
    tentativas: [{ lang: 'en', titulo: 'Berliner (pastry)' }, { lang: 'en', titulo: 'Doughnut' }] },

  { nome: 'Brigadeiro',
    tentativas: [{ lang: 'pt', titulo: 'Brigadeiro' }, { lang: 'en', titulo: 'Brigadeiro' }] },

  { nome: 'Palha Italiana',
    tentativas: [{ lang: 'pt', titulo: 'Palha italiana' }, { lang: 'en', titulo: 'Fudge' }] },

  { nome: 'Pão de Mel',
    tentativas: [{ lang: 'pt', titulo: 'Pão de mel' }, { lang: 'en', titulo: 'Honey cake' }] },

  { nome: 'Cuca',
    tentativas: [{ lang: 'pt', titulo: 'Cuca (bolo)' }, { lang: 'en', titulo: 'Streuselkuchen' }] },
];

async function buscarImagemWikipedia(lang, titulo) {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'padaria-perdas/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function pausa(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('🖼️  Buscando imagens no Wikipedia...\n');
  let atualizados = 0;
  let semImagem   = 0;

  for (const item of mapeamento) {
    let imgUrl = null;

    for (const t of item.tentativas) {
      imgUrl = await buscarImagemWikipedia(t.lang, t.titulo);
      await pausa(800); // pausa entre chamadas para não sobrecarregar
      if (imgUrl) break;
    }

    if (imgUrl) {
      await db.query(`UPDATE produtos SET imagem_url = $1 WHERE nome = $2`, [imgUrl, item.nome]);
      console.log(`  ✅ ${item.nome}`);
      atualizados++;
    } else {
      console.log(`  ❌ ${item.nome}`);
      semImagem++;
    }
  }

  console.log(`\n📊 Resultado: ${atualizados} ✅  |  ${semImagem} ❌`);
  if (semImagem > 0) console.log('💡 Os que falharam podem ser editados pelo app.');
  process.exit(0);
})();
