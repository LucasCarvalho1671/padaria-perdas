// seed-imagens.js — Busca imagens no Wikimedia Commons e salva nos produtos
// Rodar com: node seed-imagens.js
// Requer Node.js 18+ (fetch nativo)

require('dotenv').config();
const db = require('./src/db/index');

// Para cada produto: lista de termos de busca em ordem de preferência
// O script tenta cada termo até achar uma foto real (jpg/png)
const mapeamento = [
  // ── PÃES ──────────────────────────────────────────────────
  { nome: 'Pão Francês',             termos: ['pão francês', 'french bread roll', 'dinner roll bread'] },
  { nome: 'Pão de Queijo',           termos: ['pão de queijo', 'Brazilian cheese bread', 'cheese bread ball'] },
  { nome: 'Pão Integral',            termos: ['whole wheat bread sliced', 'wholegrain bread'] },
  { nome: 'Pão de Forma',            termos: ['sandwich bread loaf', 'sliced bread loaf'] },
  { nome: 'Pão Sírio',               termos: ['pita bread', 'arabic flatbread'] },
  { nome: 'Pão de Hot Dog',          termos: ['hot dog bun bread', 'hot dog roll'] },
  { nome: 'Pão de Hambúrguer',       termos: ['hamburger bun bread', 'burger bun sesame'] },
  { nome: 'Baguete',                 termos: ['baguette bread', 'french baguette'] },
  { nome: 'Croissant',               termos: ['croissant pastry', 'croissant butter'] },
  { nome: 'Rosca Doce',              termos: ['sweet bread ring rosca', 'sweet roll ring'] },
  { nome: 'Broa de Milho',           termos: ['broa cornbread', 'corn bread loaf'] },
  { nome: 'Pão de Batata',           termos: ['potato bread roll', 'pão de batata'] },
  { nome: 'Pão Sovado',              termos: ['soft bread roll white', 'sweet bread roll'] },
  { nome: 'Pão de Leite',            termos: ['milk bread roll', 'Japanese milk bread'] },

  // ── SALGADOS ──────────────────────────────────────────────
  { nome: 'Coxinha',                 termos: ['coxinha Brazilian', 'coxinha salgado'] },
  { nome: 'Empada',                  termos: ['empada Brazilian pastry', 'empanada pie small'] },
  { nome: 'Esfiha',                  termos: ['esfiha salgado', 'sfiha Lebanese pastry'] },
  { nome: 'Quibe',                   termos: ['quibe frito', 'kibbeh fried'] },
  { nome: 'Pastel',                  termos: ['pastel frito brasileiro', 'Brazilian pastel fried'] },
  { nome: 'Enroladinho de Salsicha', termos: ['sausage roll pastry', 'pigs in blankets bread'] },
  { nome: 'Pão de Batata Recheado',  termos: ['stuffed bread roll', 'recheado bread filled'] },
  { nome: 'Torta Salgada',           termos: ['savory pie slice', 'torta salgada'] },

  // ── BOLOS E DOCES ─────────────────────────────────────────
  { nome: 'Bolo de Chocolate',       termos: ['chocolate cake slice', 'chocolate layer cake'] },
  { nome: 'Bolo de Cenoura',         termos: ['carrot cake slice', 'bolo cenoura chocolate'] },
  { nome: 'Bolo de Laranja',         termos: ['orange cake', 'orange pound cake'] },
  { nome: 'Bolo de Fubá',            termos: ['bolo fubá', 'cornmeal cake Brazilian'] },
  { nome: 'Bolo de Coco',            termos: ['coconut cake slice', 'coconut layer cake'] },
  { nome: 'Sonho',                   termos: ['berliner doughnut cream', 'filled doughnut jam'] },
  { nome: 'Brigadeiro',              termos: ['brigadeiro chocolate Brazilian', 'brigadeiro sweet'] },
  { nome: 'Palha Italiana',          termos: ['palha italiana Brazilian sweet', 'chocolate fudge cut'] },
  { nome: 'Pão de Mel',              termos: ['pão de mel Brazilian', 'honey cake chocolate coated'] },
  { nome: 'Cuca',                    termos: ['cuca bolo streusel', 'crumb cake German streusel'] },
];

// Busca imagem no Wikimedia Commons tentando cada termo em ordem
async function buscarImagem(termos) {
  for (const termo of termos) {
    try {
      const params = new URLSearchParams({
        action:       'query',
        generator:    'search',
        gsrsearch:    termo,
        gsrnamespace: 6,       // namespace 6 = arquivos (File:)
        gsrlimit:     8,       // pega as 8 primeiras e filtra
        prop:         'imageinfo',
        iiprop:       'url|mime',
        iiurlwidth:   400,
        format:       'json',
        origin:       '*',
      });

      const res  = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});

      // Filtra apenas jpg/png (não svg, gif, webp ou pdf)
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) continue;
        const mime = info.mime || '';
        if (mime.includes('jpeg') || mime.includes('png')) {
          return info.thumburl;
        }
      }
    } catch {
      // Falhou nesse termo, tenta o próximo
    }

    // Pequena pausa entre buscas para não sobrecarregar a API
    await new Promise(r => setTimeout(r, 400));
  }
  return null;
}

(async () => {
  console.log('🖼️  Buscando imagens no Wikimedia Commons...\n');
  let atualizados = 0;
  let semImagem   = 0;

  for (const item of mapeamento) {
    const imgUrl = await buscarImagem(item.termos);

    if (imgUrl) {
      await db.query(
        `UPDATE produtos SET imagem_url = $1 WHERE nome = $2`,
        [imgUrl, item.nome]
      );
      console.log(`  ✅ ${item.nome}`);
      atualizados++;
    } else {
      console.log(`  ❌ ${item.nome} — não encontrado`);
      semImagem++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ ${atualizados} produtos com imagem`);
  console.log(`   ❌ ${semImagem} sem imagem`);
  if (semImagem > 0) {
    console.log(`\n💡 Para os que falharam, adicione a URL manualmente pelo app.`);
  }
  process.exit(0);
})();
