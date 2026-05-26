// seed-imagens.js — Busca imagens do Wikipedia e salva nos produtos
// Rodar com: node seed-imagens.js
// Requer Node.js 18+ (fetch nativo)

require('dotenv').config();
const db = require('./src/db/index');

// Mapeamento: nome do produto → artigo no Wikipedia
// lang: 'pt' = Wikipedia em português | 'en' = Wikipedia em inglês
const mapeamento = [
  // ── PÃES ──────────────────────────────────────────────────
  { nome: 'Pão Francês',              lang: 'pt', titulo: 'Pão francês' },
  { nome: 'Pão de Queijo',            lang: 'pt', titulo: 'Pão de queijo' },
  { nome: 'Pão Integral',             lang: 'pt', titulo: 'Pão integral' },
  { nome: 'Pão de Forma',             lang: 'pt', titulo: 'Pão de forma' },
  { nome: 'Pão Sírio',                lang: 'pt', titulo: 'Pão sírio' },
  { nome: 'Pão de Hot Dog',           lang: 'en', titulo: 'Hot dog bun' },
  { nome: 'Pão de Hambúrguer',        lang: 'en', titulo: 'Hamburger bun' },
  { nome: 'Baguete',                  lang: 'pt', titulo: 'Baguete' },
  { nome: 'Croissant',                lang: 'pt', titulo: 'Croissant' },
  { nome: 'Rosca Doce',               lang: 'pt', titulo: 'Rosca (alimento)' },
  { nome: 'Broa de Milho',            lang: 'pt', titulo: 'Broa' },
  { nome: 'Pão de Batata',            lang: 'pt', titulo: 'Pão de batata' },
  { nome: 'Pão Sovado',               lang: 'pt', titulo: 'Pão sovado' },
  { nome: 'Pão de Leite',             lang: 'pt', titulo: 'Pão de leite' },

  // ── SALGADOS ──────────────────────────────────────────────
  { nome: 'Coxinha',                  lang: 'pt', titulo: 'Coxinha' },
  { nome: 'Empada',                   lang: 'pt', titulo: 'Empada' },
  { nome: 'Esfiha',                   lang: 'pt', titulo: 'Esfiha' },
  { nome: 'Quibe',                    lang: 'pt', titulo: 'Quibe' },
  { nome: 'Pastel',                   lang: 'pt', titulo: 'Pastel (culinária)' },
  { nome: 'Enroladinho de Salsicha',  lang: 'en', titulo: 'Pigs in blankets' },
  { nome: 'Pão de Batata Recheado',   lang: 'pt', titulo: 'Pão de batata' },
  { nome: 'Torta Salgada',            lang: 'pt', titulo: 'Torta salgada' },

  // ── BOLOS E DOCES ─────────────────────────────────────────
  { nome: 'Bolo de Chocolate',        lang: 'pt', titulo: 'Bolo de chocolate' },
  { nome: 'Bolo de Cenoura',          lang: 'pt', titulo: 'Bolo de cenoura' },
  { nome: 'Bolo de Laranja',          lang: 'en', titulo: 'Orange cake' },
  { nome: 'Bolo de Fubá',             lang: 'pt', titulo: 'Bolo de fubá' },
  { nome: 'Bolo de Coco',             lang: 'en', titulo: 'Coconut cake' },
  { nome: 'Sonho',                    lang: 'en', titulo: 'Berliner (pastry)' },
  { nome: 'Brigadeiro',               lang: 'pt', titulo: 'Brigadeiro' },
  { nome: 'Palha Italiana',           lang: 'pt', titulo: 'Palha italiana' },
  { nome: 'Pão de Mel',               lang: 'pt', titulo: 'Pão de mel' },
  { nome: 'Cuca',                     lang: 'pt', titulo: 'Cuca (bolo)' },
];

async function buscarImagemWikipedia(lang, titulo) {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(titulo)}` +
      `&prop=pageimages&format=json&pithumbsize=400&origin=*`;

    const res  = await fetch(url);
    const data = await res.json();
    const pages = Object.values(data.query.pages);
    return pages[0]?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

(async () => {
  console.log('🖼️  Buscando imagens do Wikipedia...\n');
  let atualizados = 0;
  let semImagem   = 0;

  for (const item of mapeamento) {
    const imgUrl = await buscarImagemWikipedia(item.lang, item.titulo);

    if (imgUrl) {
      await db.query(
        `UPDATE produtos SET imagem_url = $1 WHERE nome = $2`,
        [imgUrl, item.nome]
      );
      console.log(`  ✅ ${item.nome}`);
      atualizados++;
    } else {
      console.log(`  ⚠️  ${item.nome} — imagem não encontrada no Wikipedia`);
      semImagem++;
    }

    // Pequena pausa para não sobrecarregar a API do Wikipedia
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n🎉 Concluído!`);
  console.log(`   ✅ ${atualizados} produtos com imagem`);
  if (semImagem > 0) {
    console.log(`   ⚠️  ${semImagem} sem imagem — adicione manualmente pelo app`);
  }
  process.exit(0);
})();
