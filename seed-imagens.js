// seed-imagens.js — Busca imagens: Wikipedia (1ª fonte) + Pixabay (2ª fonte)
// Rodar com: node seed-imagens.js
// Requer Node.js 18+ e PIXABAY_KEY no .env

require('dotenv').config();
const db = require('./src/db/index');

const PIXABAY_KEY = process.env.PIXABAY_KEY;

const mapeamento = [
  // ── PÃES ──────────────────────────────────────────────────
  { nome: 'Pão Francês',
    wiki: { lang: 'pt', titulo: 'Pão francês' },
    pixabay: 'french bread roll' },

  { nome: 'Pão de Queijo',
    wiki: { lang: 'pt', titulo: 'Pão de queijo' },
    pixabay: 'pão de queijo cheese bread' },

  { nome: 'Pão Integral',
    wiki: { lang: 'en', titulo: 'Whole wheat bread' },
    pixabay: 'whole wheat bread loaf' },

  { nome: 'Pão de Forma',
    wiki: { lang: 'en', titulo: 'Sliced bread' },
    pixabay: 'sliced white bread loaf' },

  { nome: 'Pão Sírio',
    wiki: { lang: 'en', titulo: 'Pita' },
    pixabay: 'pita bread flatbread' },

  { nome: 'Pão de Hot Dog',
    wiki: { lang: 'en', titulo: 'Hot dog bun' },
    pixabay: 'hot dog bun bread' },

  { nome: 'Pão de Hambúrguer',
    wiki: { lang: 'en', titulo: 'Hamburger' },
    pixabay: 'hamburger bun sesame bread' },

  { nome: 'Baguete',
    wiki: { lang: 'pt', titulo: 'Baguete' },
    pixabay: 'baguette french bread' },

  { nome: 'Croissant',
    wiki: { lang: 'en', titulo: 'Croissant' },
    pixabay: 'croissant pastry butter' },

  { nome: 'Rosca Doce',
    wiki: { lang: 'en', titulo: 'Cinnamon roll' },
    pixabay: 'sweet bread ring cinnamon roll' },

  { nome: 'Broa de Milho',
    wiki: { lang: 'en', titulo: 'Cornbread' },
    pixabay: 'cornbread corn bread' },

  { nome: 'Pão de Batata',
    wiki: { lang: 'en', titulo: 'Potato bread' },
    pixabay: 'potato bread soft roll' },

  { nome: 'Pão Sovado',
    wiki: { lang: 'en', titulo: 'Bread roll' },
    pixabay: 'soft white bread roll' },

  { nome: 'Pão de Leite',
    wiki: { lang: 'en', titulo: 'Milk bread' },
    pixabay: 'milk bread soft Japanese' },

  // ── SALGADOS ──────────────────────────────────────────────
  { nome: 'Coxinha',
    wiki: { lang: 'pt', titulo: 'Coxinha' },
    pixabay: 'coxinha brazilian snack' },

  { nome: 'Empada',
    wiki: { lang: 'pt', titulo: 'Empada' },
    pixabay: 'empanada small pie pastry' },

  { nome: 'Esfiha',
    wiki: { lang: 'pt', titulo: 'Esfiha' },
    pixabay: 'sfiha meat pastry' },

  { nome: 'Quibe',
    wiki: { lang: 'en', titulo: 'Kibbeh' },
    pixabay: 'kibbeh fried meat' },

  { nome: 'Pastel',
    wiki: { lang: 'pt', titulo: 'Pastel (culinária)' },
    pixabay: 'pastel fried pastry brazilian' },

  { nome: 'Enroladinho de Salsicha',
    wiki: { lang: 'en', titulo: 'Sausage roll' },
    pixabay: 'sausage roll bread pastry' },

  { nome: 'Pão de Batata Recheado',
    wiki: { lang: 'en', titulo: 'Stuffed bread' },
    pixabay: 'stuffed bread roll filled' },

  { nome: 'Torta Salgada',
    wiki: { lang: 'en', titulo: 'Quiche' },
    pixabay: 'savory pie slice quiche' },

  // ── BOLOS E DOCES ─────────────────────────────────────────
  { nome: 'Bolo de Chocolate',
    wiki: { lang: 'en', titulo: 'Chocolate cake' },
    pixabay: 'chocolate cake slice' },

  { nome: 'Bolo de Cenoura',
    wiki: { lang: 'pt', titulo: 'Bolo de cenoura' },
    pixabay: 'carrot cake slice' },

  { nome: 'Bolo de Laranja',
    wiki: { lang: 'en', titulo: 'Orange cake' },
    pixabay: 'orange cake homemade' },

  { nome: 'Bolo de Fubá',
    wiki: { lang: 'pt', titulo: 'Bolo de fubá' },
    pixabay: 'cornmeal cake yellow' },

  { nome: 'Bolo de Coco',
    wiki: { lang: 'en', titulo: 'Coconut cake' },
    pixabay: 'coconut cake white' },

  { nome: 'Sonho',
    wiki: { lang: 'en', titulo: 'Berliner (pastry)' },
    pixabay: 'berliner doughnut cream filled' },

  { nome: 'Brigadeiro',
    wiki: { lang: 'pt', titulo: 'Brigadeiro' },
    pixabay: 'brigadeiro chocolate brazilian sweet' },

  { nome: 'Palha Italiana',
    wiki: { lang: 'pt', titulo: 'Palha italiana' },
    pixabay: 'chocolate fudge square brazilian' },

  { nome: 'Pão de Mel',
    wiki: { lang: 'pt', titulo: 'Pão de mel' },
    pixabay: 'honey cake chocolate coated' },

  { nome: 'Cuca',
    wiki: { lang: 'en', titulo: 'Streuselkuchen' },
    pixabay: 'streusel cake crumb topping' },
];

// ── Wikipedia REST API ─────────────────────────────────────
async function buscarWikipedia(lang, titulo) {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'padaria-perdas/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || null;
  } catch { return null; }
}

// ── Pixabay API ────────────────────────────────────────────
async function buscarPixabay(termo) {
  if (!PIXABAY_KEY) return null;
  try {
    const params = new URLSearchParams({
      key:        PIXABAY_KEY,
      q:          termo,
      image_type: 'photo',
      category:   'food',
      per_page:   5,
      safesearch: true,
      lang:       'en',
      min_width:  300,
    });
    const res  = await fetch(`https://pixabay.com/api/?${params}`);
    const data = await res.json();
    return data.hits?.[0]?.webformatURL || null;
  } catch { return null; }
}

function pausa(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  if (!PIXABAY_KEY) {
    console.log('⚠️  PIXABAY_KEY não encontrada no .env — usando só Wikipedia.\n');
  }

  console.log('🖼️  Buscando imagens (Wikipedia → Pixabay)...\n');
  let wiki = 0, pixabay = 0, falhou = 0;

  for (const item of mapeamento) {
    // 1ª tentativa: Wikipedia
    let imgUrl = await buscarWikipedia(item.wiki.lang, item.wiki.titulo);
    let fonte  = 'Wikipedia';
    await pausa(600);

    // 2ª tentativa: Pixabay
    if (!imgUrl) {
      imgUrl = await buscarPixabay(item.pixabay);
      fonte  = 'Pixabay';
      await pausa(400);
    }

    if (imgUrl) {
      await db.query(`UPDATE produtos SET imagem_url = $1 WHERE nome = $2`, [imgUrl, item.nome]);
      console.log(`  ✅ ${item.nome.padEnd(28)} [${fonte}]`);
      fonte === 'Wikipedia' ? wiki++ : pixabay++;
    } else {
      console.log(`  ❌ ${item.nome}`);
      falhou++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Wikipedia : ${wiki}`);
  console.log(`   ✅ Pixabay   : ${pixabay}`);
  console.log(`   ❌ Sem imagem: ${falhou}`);
  if (falhou > 0) console.log('\n💡 Os que falharam podem ser editados pelo app.');
  process.exit(0);
})();
