const express  = require('express');
const bcrypt   = require('bcrypt');
const router   = express.Router();

const PIXABAY_KEY = process.env.PIXABAY_KEY;

// Mapeamento: nome PT → termos de busca corretos (Wikipedia + Pixabay em inglês)
const MAPA_BUSCA = {
  'pão francês':             { wiki: { lang: 'pt', titulo: 'Pão francês' },          pixabay: 'french bread roll' },
  'pão de queijo':           { wiki: { lang: 'pt', titulo: 'Pão de queijo' },         pixabay: 'pao de queijo cheese bread' },
  'pão integral':            { wiki: { lang: 'en', titulo: 'Whole wheat bread' },     pixabay: 'whole wheat bread loaf' },
  'pão de forma':            { wiki: { lang: 'en', titulo: 'Sliced bread' },          pixabay: 'sliced white bread loaf' },
  'pão sírio':               { wiki: { lang: 'en', titulo: 'Pita' },                  pixabay: 'pita bread flatbread' },
  'pão de hot dog':          { wiki: { lang: 'en', titulo: 'Hot dog bun' },           pixabay: 'hot dog bun bread' },
  'pão de hambúrguer':       { wiki: { lang: 'en', titulo: 'Hamburger' },             pixabay: 'hamburger bun sesame bread' },
  'baguete':                 { wiki: { lang: 'pt', titulo: 'Baguete' },               pixabay: 'baguette french bread' },
  'croissant':               { wiki: { lang: 'en', titulo: 'Croissant' },             pixabay: 'croissant pastry butter' },
  'rosca doce':              { wiki: { lang: 'en', titulo: 'Cinnamon roll' },         pixabay: 'sweet bread ring cinnamon roll' },
  'broa de milho':           { wiki: { lang: 'en', titulo: 'Cornbread' },             pixabay: 'cornbread corn bread' },
  'pão de batata':           { wiki: { lang: 'en', titulo: 'Potato bread' },          pixabay: 'potato bread soft roll' },
  'pão sovado':              { wiki: { lang: 'en', titulo: 'Bread roll' },            pixabay: 'soft white bread roll' },
  'pão de leite':            { wiki: { lang: 'en', titulo: 'Milk bread' },            pixabay: 'milk bread soft japanese' },
  'coxinha':                 { wiki: { lang: 'pt', titulo: 'Coxinha' },               pixabay: 'coxinha brazilian snack fried' },
  'empada':                  { wiki: { lang: 'pt', titulo: 'Empada' },                pixabay: 'empanada small pie pastry' },
  'esfiha':                  { wiki: { lang: 'pt', titulo: 'Esfiha' },                pixabay: 'sfiha meat pastry arabic' },
  'quibe':                   { wiki: { lang: 'en', titulo: 'Kibbeh' },                pixabay: 'kibbeh fried meat' },
  'pastel':                  { wiki: { lang: 'pt', titulo: 'Pastel (culinária)' },    pixabay: 'pastel fried pastry brazilian' },
  'enroladinho de salsicha': { wiki: { lang: 'en', titulo: 'Sausage roll' },          pixabay: 'sausage roll bread pastry' },
  'pão de batata recheado':  { wiki: { lang: 'en', titulo: 'Stuffed bread' },         pixabay: 'stuffed bread roll filled' },
  'torta salgada':           { wiki: { lang: 'en', titulo: 'Quiche' },                pixabay: 'savory pie slice quiche' },
  'bolo de chocolate':       { wiki: { lang: 'en', titulo: 'Chocolate cake' },        pixabay: 'chocolate cake slice' },
  'bolo de cenoura':         { wiki: { lang: 'pt', titulo: 'Bolo de cenoura' },       pixabay: 'carrot cake slice' },
  'bolo de laranja':         { wiki: { lang: 'en', titulo: 'Orange cake' },           pixabay: 'orange cake homemade' },
  'bolo de fubá':            { wiki: { lang: 'pt', titulo: 'Bolo de fubá' },          pixabay: 'cornmeal cake yellow fuba' },
  'bolo de coco':            { wiki: { lang: 'en', titulo: 'Coconut cake' },          pixabay: 'coconut cake white shredded' },
  'sonho':                   { wiki: { lang: 'en', titulo: 'Berliner (pastry)' },     pixabay: 'berliner doughnut cream filled' },
  'brigadeiro':              { wiki: { lang: 'pt', titulo: 'Brigadeiro' },            pixabay: 'brigadeiro chocolate brazilian sweet' },
  'palha italiana':          { wiki: { lang: 'pt', titulo: 'Palha italiana' },        pixabay: 'chocolate fudge square brownie' },
  'pão de mel':              { wiki: { lang: 'pt', titulo: 'Pão de mel' },            pixabay: 'honey cake chocolate coated' },
  'cuca':                    { wiki: { lang: 'en', titulo: 'Streuselkuchen' },        pixabay: 'streusel cake crumb topping' },
};

// Busca imagem principal de um artigo do Wikipedia
async function imgWikipedia(lang, titulo) {
  try {
    const res  = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`,
      { headers: { 'User-Agent': 'padaria-perdas/1.0' } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return d.thumbnail?.source || null;
  } catch { return null; }
}

// Busca até N imagens no Pixabay
async function imgPixabay(termo, quantidade = 4) {
  if (!PIXABAY_KEY) return [];
  try {
    const params = new URLSearchParams({
      key: PIXABAY_KEY, q: termo, image_type: 'photo',
      category: 'food', per_page: quantidade,
      safesearch: true, lang: 'en', min_width: 300,
    });
    const res  = await fetch(`https://pixabay.com/api/?${params}`);
    const data = await res.json();
    return (data.hits || []).map(h => h.webformatURL);
  } catch { return []; }
}

// Formata Date do PostgreSQL → DD/MM/AAAA (usa UTC para não deslocar por fuso)
function formatarData(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const dia = String(dt.getUTCDate()).padStart(2, '0');
  const mes = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const ano = dt.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Gera CSV sem dependências externas — Excel abre normalmente
function gerarCSV(colunas, linhas) {
  // Separador ; porque no Excel brasileiro a vírgula é decimal (R$ 1,50)
  const SEP = ';';
  const escapar = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(SEP) || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = colunas.map(escapar).join(SEP);
  const corpo  = linhas.map(l => colunas.map(c => escapar(l[c])).join(SEP)).join('\r\n');
  return '﻿' + header + '\r\n' + corpo; // BOM + CRLF para Excel reconhecer UTF-8
}
const { autenticar } = require('./auth');
const { erroInterno } = require('../utils/helpers');

const dbProdutos = require('../db/produtos');
const dbMotivos  = require('../db/motivos');
const dbPerdas   = require('../db/perdas');
const dbProducao = require('../db/producao');
const dbUsuarios = require('../db/usuarios');

// ============================================================
// PRODUTOS
// ============================================================
router.get('/produtos', autenticar, async (req, res) => {
  try {
    const apenasAtivos = req.query.todos !== 'true';
    const lista = await dbProdutos.listar(apenasAtivos);
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /produtos'); }
});

router.post('/produtos', autenticar, async (req, res) => {
  try {
    const { nome, unidade, custo, imagem_url } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const produto = await dbProdutos.criar({ nome, unidade, custo, imagem_url });
    res.status(201).json(produto);
  } catch (err) { erroInterno(res, err, 'POST /produtos'); }
});

router.put('/produtos/:id', autenticar, async (req, res) => {
  try {
    const produto = await dbProdutos.atualizar(req.params.id, req.body);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
    res.json(produto);
  } catch (err) { erroInterno(res, err, 'PUT /produtos'); }
});

router.delete('/produtos/:id', autenticar, async (req, res) => {
  try {
    await dbProdutos.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'Este produto possui perdas ou produções registradas e não pode ser excluído. Use "Inativar" para ocultá-lo.' });
    }
    erroInterno(res, err, 'DELETE /produtos');
  }
});

// ============================================================
// MOTIVOS
// ============================================================
router.get('/motivos', autenticar, async (req, res) => {
  try {
    const apenasAtivos = req.query.todos !== 'true';
    const lista = await dbMotivos.listar(apenasAtivos);
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /motivos'); }
});

router.post('/motivos', autenticar, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const motivo = await dbMotivos.criar({ nome });
    res.status(201).json(motivo);
  } catch (err) { erroInterno(res, err, 'POST /motivos'); }
});

router.put('/motivos/:id', autenticar, async (req, res) => {
  try {
    const motivo = await dbMotivos.atualizar(req.params.id, req.body);
    if (!motivo) return res.status(404).json({ erro: 'Motivo não encontrado.' });
    res.json(motivo);
  } catch (err) { erroInterno(res, err, 'PUT /motivos'); }
});

router.delete('/motivos/:id', autenticar, async (req, res) => {
  try {
    await dbMotivos.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'Este motivo está vinculado a perdas registradas e não pode ser excluído. Use "Inativar" para ocultá-lo.' });
    }
    erroInterno(res, err, 'DELETE /motivos');
  }
});

// ============================================================
// PERDAS
// ============================================================
router.get('/perdas', autenticar, async (req, res) => {
  try {
    const { dataInicio, dataFim, produto_id, motivo_id } = req.query;
    const lista = await dbPerdas.listar({ dataInicio, dataFim, produto_id, motivo_id });
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /perdas'); }
});

router.post('/perdas', autenticar, async (req, res) => {
  try {
    const { produto_id, motivo_id, quantidade, data, observacao } = req.body;
    if (!produto_id || !motivo_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, motivo, quantidade e data são obrigatórios.' });
    }

    // Calcula valor total se o produto tiver custo cadastrado
    const produto = await dbProdutos.buscarPorId(produto_id);
    const valor_total = produto?.custo ? (produto.custo * quantidade) : null;

    const perda = await dbPerdas.criar({
      produto_id, motivo_id, quantidade, valor_total,
      data, observacao, usuario_id: req.usuario.id,
    });
    res.status(201).json(perda);
  } catch (err) { erroInterno(res, err, 'POST /perdas'); }
});

router.delete('/perdas/:id', autenticar, async (req, res) => {
  try {
    await dbPerdas.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) { erroInterno(res, err, 'DELETE /perdas'); }
});

// ============================================================
// PRODUÇÃO
// ============================================================
router.get('/producao', autenticar, async (req, res) => {
  try {
    const { dataInicio, dataFim, produto_id } = req.query;
    const lista = await dbProducao.listar({ dataInicio, dataFim, produto_id });
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /producao'); }
});

router.post('/producao', autenticar, async (req, res) => {
  try {
    const { produto_id, quantidade, data, observacao } = req.body;
    if (!produto_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, quantidade e data são obrigatórios.' });
    }
    const registro = await dbProducao.criar({
      produto_id, quantidade, data, observacao, usuario_id: req.usuario.id,
    });
    res.status(201).json(registro);
  } catch (err) { erroInterno(res, err, 'POST /producao'); }
});

router.delete('/producao/:id', autenticar, async (req, res) => {
  try {
    await dbProducao.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) { erroInterno(res, err, 'DELETE /producao'); }
});

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard', autenticar, async (req, res) => {
  try {
    const [resumo, topProdutos, porMotivo, comparativo] = await Promise.all([
      dbPerdas.resumoDashboard(),
      dbPerdas.topProdutosPerdidos(5),
      dbPerdas.perdasPorMotivo(),
      dbProducao.comparativo(),
    ]);
    res.json({ resumo, topProdutos, porMotivo, comparativo });
  } catch (err) { erroInterno(res, err, 'GET /dashboard'); }
});

// ============================================================
// RELATÓRIO — exportar para CSV (abre direto no Excel)
// ============================================================
router.get('/relatorio/exportar', autenticar, async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo = 'perdas' } = req.query;

    let csv, nomeArquivo;

    if (tipo === 'producao') {
      const producao = await dbProducao.listar({ dataInicio, dataFim });
      const colunas  = ['data', 'produto_nome', 'unidade', 'quantidade', 'observacao', 'usuario_nome'];
      const linhas   = producao.map(p => ({
        data:          p.data,
        produto_nome:  p.produto_nome,
        unidade:       p.unidade,
        quantidade:    Number(p.quantidade),
        observacao:    p.observacao || '',
        usuario_nome:  p.usuario_nome,
      }));
      csv = gerarCSV(['Data', 'Produto', 'Unidade', 'Quantidade', 'Observação', 'Registrado por'], linhas.map(l =>
        ({ Data: formatarData(l.data), Produto: l.produto_nome, Unidade: l.unidade, Quantidade: l.quantidade, 'Observação': l.observacao, 'Registrado por': l.usuario_nome })
      ));
      nomeArquivo = 'producao-padaria.csv';
    } else {
      const perdas  = await dbPerdas.listar({ dataInicio, dataFim });
      const linhas  = perdas.map(p => ({
        Data:          formatarData(p.data),
        Produto:       p.produto_nome,
        Unidade:       p.unidade,
        Quantidade:    Number(p.quantidade),
        'Valor (R$)':  p.valor_total ? Number(p.valor_total).toFixed(2) : '',
        Motivo:        p.motivo_nome,
        'Observação':  p.observacao || '',
        'Registrado por': p.usuario_nome,
      }));
      csv = gerarCSV(['Data','Produto','Unidade','Quantidade','Valor (R$)','Motivo','Observação','Registrado por'], linhas);
      nomeArquivo = 'perdas-padaria.csv';
    }

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) { erroInterno(res, err, 'GET /relatorio/exportar'); }
});

// ============================================================
// BUSCA DE IMAGENS — usado pelo seletor de imagens no cadastro
// GET /api/imagens/buscar?q=pao+frances&wiki_lang=pt&wiki_titulo=Pão+francês
// ============================================================
router.get('/imagens/buscar', autenticar, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ erro: 'Parâmetro q é obrigatório.' });

    const resultados = [];

    // Verifica se existe mapeamento específico para esse produto
    const mapa = MAPA_BUSCA[q.toLowerCase().trim()];

    // 1. Tenta Wikipedia (usa o artigo correto do mapeamento, se houver)
    if (mapa?.wiki) {
      const url = await imgWikipedia(mapa.wiki.lang, mapa.wiki.titulo);
      if (url) resultados.push(url);
    }

    // 2. Complementa com Pixabay (usa termo em inglês do mapeamento, ou o nome original)
    const termoBusca = mapa?.pixabay || q;
    const faltam = 4 - resultados.length;
    if (faltam > 0) {
      const pixabayUrls = await imgPixabay(termoBusca, faltam + 1);
      for (const url of pixabayUrls) {
        if (!resultados.includes(url)) resultados.push(url);
        if (resultados.length >= 4) break;
      }
    }

    res.json({ imagens: resultados });
  } catch (err) { erroInterno(res, err, 'GET /imagens/buscar'); }
});

// ============================================================
// USUÁRIOS
// ============================================================
router.get('/usuarios', autenticar, async (req, res) => {
  try {
    const lista = await dbUsuarios.listar();
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /usuarios'); }
});

router.post('/usuarios', autenticar, async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await dbUsuarios.criar({ nome, email, senha: senhaHash });
    res.status(201).json(usuario);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    erroInterno(res, err, 'POST /usuarios');
  }
});

router.delete('/usuarios/:id', autenticar, async (req, res) => {
  try {
    await dbUsuarios.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'Este usuário possui perdas ou produções registradas e não pode ser excluído. Use "Editar → Inativo" para desativá-lo.' });
    }
    erroInterno(res, err, 'DELETE /usuarios');
  }
});

router.put('/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuario = await dbUsuarios.atualizar(req.params.id, req.body);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    // Atualiza a senha se enviada (opcional)
    if (req.body.senha && req.body.senha.length >= 6) {
      const hash = await bcrypt.hash(req.body.senha, 10);
      await dbUsuarios.atualizarSenha(req.params.id, hash);
    }
    res.json(usuario);
  } catch (err) { erroInterno(res, err, 'PUT /usuarios'); }
});

module.exports = router;
