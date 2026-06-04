const express  = require('express');
const bcrypt   = require('bcrypt');
const router   = express.Router();

const PIXABAY_KEY    = process.env.PIXABAY_KEY;
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY;
const GOOGLE_CSE_ID  = process.env.GOOGLE_CSE_ID;

// Mapeamento: nome PT → termos de busca corretos (Wikipedia + Pixabay em inglês)
const MAPA_BUSCA = {
  // ── PADARIA — pães ─────────────────────────────────────────────────────────
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
  // ── PADARIA — salgados ────────────────────────────────────────────────────
  'coxinha':                 { wiki: { lang: 'pt', titulo: 'Coxinha' },               pixabay: 'coxinha brazilian snack fried' },
  'empada':                  { wiki: { lang: 'pt', titulo: 'Empada' },                pixabay: 'empanada small pie pastry' },
  'esfiha':                  { wiki: { lang: 'pt', titulo: 'Esfiha' },                pixabay: 'sfiha meat pastry arabic' },
  'quibe':                   { wiki: { lang: 'en', titulo: 'Kibbeh' },                pixabay: 'kibbeh fried meat' },
  'pastel':                  { wiki: { lang: 'pt', titulo: 'Pastel (culinária)' },    pixabay: 'pastel fried pastry brazilian' },
  'enroladinho de salsicha': { wiki: { lang: 'en', titulo: 'Sausage roll' },          pixabay: 'sausage roll bread pastry' },
  'pão de batata recheado':  { wiki: { lang: 'en', titulo: 'Stuffed bread' },         pixabay: 'stuffed bread roll filled' },
  'torta salgada':           { wiki: { lang: 'en', titulo: 'Quiche' },                pixabay: 'savory pie slice quiche' },
  // ── PADARIA — bolos e doces ───────────────────────────────────────────────
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
  // ── AÇOUGUE — bovinos ─────────────────────────────────────────────────────
  'picanha':                 { wiki: { lang: 'en', titulo: 'Rump cover' },            pixabay: 'picanha beef rump cap grilled' },
  'alcatra':                 { wiki: { lang: 'en', titulo: 'Top sirloin' },           pixabay: 'top sirloin beef steak' },
  'fraldinha':               { wiki: { lang: 'en', titulo: 'Flank steak' },           pixabay: 'flank steak beef raw' },
  'costela bovina':          { wiki: { lang: 'en', titulo: 'Beef ribs' },             pixabay: 'beef ribs barbecue grilled' },
  'filé mignon':             { wiki: { lang: 'en', titulo: 'Filet mignon' },          pixabay: 'filet mignon beef tenderloin' },
  'contrafilé':              { wiki: { lang: 'en', titulo: 'Sirloin steak' },         pixabay: 'sirloin steak beef raw' },
  'maminha':                 { wiki: { lang: 'en', titulo: 'Tri-tip' },               pixabay: 'tri tip beef steak raw' },
  'coxão mole':              { wiki: { lang: 'en', titulo: 'Round steak' },           pixabay: 'round steak beef raw' },
  'coxão duro':              { wiki: { lang: 'en', titulo: 'Round steak' },           pixabay: 'top round beef steak raw' },
  'patinho':                 { wiki: { lang: 'en', titulo: 'Round steak' },           pixabay: 'beef knuckle round steak' },
  'acém':                    { wiki: { lang: 'en', titulo: 'Chuck steak' },           pixabay: 'chuck steak beef raw' },
  'ponta de agulha':         { wiki: { lang: 'en', titulo: 'Brisket' },              pixabay: 'beef brisket raw short ribs' },
  'músculo bovino':          { wiki: { lang: 'en', titulo: 'Beef shank' },            pixabay: 'beef shank ossobuco raw' },
  'carne moída':             { wiki: { lang: 'en', titulo: 'Ground beef' },           pixabay: 'ground beef minced meat raw' },
  'fígado bovino':           { wiki: { lang: 'en', titulo: 'Beef liver' },            pixabay: 'beef liver raw sliced' },
  // ── AÇOUGUE — frango ──────────────────────────────────────────────────────
  'frango inteiro':          { wiki: { lang: 'en', titulo: 'Chicken as food' },       pixabay: 'whole chicken raw uncooked' },
  'peito de frango':         { wiki: { lang: 'en', titulo: 'Chicken as food' },       pixabay: 'chicken breast raw uncooked' },
  'coxa de frango':          { wiki: { lang: 'en', titulo: 'Chicken as food' },       pixabay: 'chicken thigh raw uncooked' },
  'sobrecoxa de frango':     { wiki: { lang: 'en', titulo: 'Chicken as food' },       pixabay: 'chicken leg thigh raw' },
  'asa de frango':           { wiki: { lang: 'en', titulo: 'Buffalo wing' },          pixabay: 'chicken wings raw uncooked' },
  'coração de frango':       { wiki: { lang: 'en', titulo: 'Chicken as food' },       pixabay: 'chicken hearts raw' },
  'moela de frango':         { wiki: { lang: 'en', titulo: 'Gizzard' },              pixabay: 'chicken gizzard raw' },
  // ── AÇOUGUE — suínos ──────────────────────────────────────────────────────
  'bacon':                   { wiki: { lang: 'en', titulo: 'Bacon' },                 pixabay: 'bacon strips raw pork' },
  'costela suína':           { wiki: { lang: 'en', titulo: 'Spare ribs' },            pixabay: 'pork ribs raw spare ribs' },
  'pernil suíno':            { wiki: { lang: 'en', titulo: 'Pork leg' },              pixabay: 'pork leg ham raw' },
  'lombo suíno':             { wiki: { lang: 'en', titulo: 'Pork loin' },             pixabay: 'pork loin raw uncooked' },
  'paleta suína':            { wiki: { lang: 'en', titulo: 'Pork shoulder' },         pixabay: 'pork shoulder raw boston butt' },
  // ── AÇOUGUE — embutidos ───────────────────────────────────────────────────
  'linguiça':                { wiki: { lang: 'pt', titulo: 'Linguiça' },              pixabay: 'sausage raw pork grilled' },
  'linguiça calabresa':      { wiki: { lang: 'pt', titulo: 'Calabresa' },             pixabay: 'calabresa sausage grilled' },
  'linguiça toscana':        { wiki: { lang: 'en', titulo: 'Italian sausage' },       pixabay: 'italian sausage raw pork' },
  'salsicha':                { wiki: { lang: 'en', titulo: 'Hot dog' },               pixabay: 'hot dog sausage red' },
  'presunto':                { wiki: { lang: 'en', titulo: 'Ham' },                   pixabay: 'ham sliced deli meat' },
  'mortadela':               { wiki: { lang: 'en', titulo: 'Mortadella' },            pixabay: 'mortadella sliced deli meat' },
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

// Busca até N imagens no Google Custom Search (biasado para Brasil + português)
async function imgGoogle(termo, quantidade = 6) {
  if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_ID) return [];
  try {
    const params = new URLSearchParams({
      key:        GOOGLE_CSE_KEY,
      cx:         GOOGLE_CSE_ID,
      q:          `"${termo}"`,  // aspas forçam frase exata no índice sem bloquear tudo
      searchType: 'image',
      num:        Math.min(quantidade, 10),
      gl:         'br',
      lr:         'lang_pt',
      imgType:    'photo',
      safe:       'active',
      imgSize:    'medium',
    });
    const res  = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    const data = await res.json();
    if (data.error) return [];
    return (data.items || []).map(item => item.link);
  } catch { return []; }
}

// Busca até N imagens no Pixabay (fallback quando Google não estiver configurado)
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
    return (data.hits || []).map(h => h.largeImageURL);
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
const { autenticar, apenasAdmin, verificarPermissao } = require('./auth');
const { erroInterno } = require('../utils/helpers');

const dbProdutos     = require('../db/produtos');
const dbMotivos      = require('../db/motivos');
const dbPerdas       = require('../db/perdas');
const dbProducao     = require('../db/producao');
const dbUsuarios     = require('../db/usuarios');
const dbFuncionarios = require('../db/funcionarios');

// ============================================================
// PRODUTOS
// ============================================================
router.get('/produtos', autenticar, async (req, res) => {
  try {
    const apenasAtivos = req.query.todos !== 'true';
    const secao = req.query.secao || null;
    const lista = await dbProdutos.listar(apenasAtivos, secao);
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /produtos'); }
});

router.post('/produtos', autenticar, verificarPermissao('cadastrar_produto'), async (req, res) => {
  try {
    const { nome, unidade, custo, valor_cobranca, imagem_url, secao } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const produto = await dbProdutos.criar({ nome, unidade, custo, valor_cobranca, imagem_url, secao });
    res.status(201).json(produto);
  } catch (err) { erroInterno(res, err, 'POST /produtos'); }
});

router.put('/produtos/:id', autenticar, verificarPermissao('editar_produto'), async (req, res) => {
  try {
    const { nome, unidade, custo, valor_cobranca, imagem_url, ativo } = req.body;
    const produto = await dbProdutos.atualizar(req.params.id, { nome, unidade, custo, valor_cobranca, imagem_url, ativo });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
    res.json(produto);
  } catch (err) { erroInterno(res, err, 'PUT /produtos'); }
});

router.delete('/produtos/:id', autenticar, verificarPermissao('excluir_produto'), async (req, res) => {
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

router.patch('/produtos/:id/favorito', autenticar, verificarPermissao('editar_produto'), async (req, res) => {
  try {
    const produto = await dbProdutos.toggleFavorito(req.params.id);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
    res.json(produto);
  } catch (err) { erroInterno(res, err, 'PATCH /produtos/favorito'); }
});

// ============================================================
// MOTIVOS
// ============================================================
router.get('/motivos', autenticar, async (req, res) => {
  try {
    const apenasAtivos = req.query.todos !== 'true';
    const secao = req.query.secao || null;
    const lista = await dbMotivos.listar(apenasAtivos, secao);
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /motivos'); }
});

router.post('/motivos', autenticar, verificarPermissao('gerenciar_motivos'), async (req, res) => {
  try {
    const { nome, secao, cobrar_negligencia } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const motivo = await dbMotivos.criar({ nome, secao, cobrar_negligencia });
    res.status(201).json(motivo);
  } catch (err) { erroInterno(res, err, 'POST /motivos'); }
});

router.put('/motivos/:id', autenticar, verificarPermissao('gerenciar_motivos'), async (req, res) => {
  try {
    const { nome, ativo, cobrar_negligencia } = req.body;
    const motivo = await dbMotivos.atualizar(req.params.id, { nome, ativo, cobrar_negligencia });
    if (!motivo) return res.status(404).json({ erro: 'Motivo não encontrado.' });
    res.json(motivo);
  } catch (err) { erroInterno(res, err, 'PUT /motivos'); }
});

router.delete('/motivos/:id', autenticar, verificarPermissao('gerenciar_motivos'), async (req, res) => {
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
    const { dataInicio, dataFim, produto_id, motivo_id, secao, funcionario_cobrado_id, apenas_com_cobranca } = req.query;
    const lista = await dbPerdas.listar({ dataInicio, dataFim, produto_id, motivo_id, secao, funcionario_cobrado_id, apenas_com_cobranca });
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /perdas'); }
});

router.post('/perdas', autenticar, async (req, res) => {
  try {
    const { produto_id, motivo_id, quantidade, data, observacao, secao, funcionario_cobrado_id, valor_cobrado } = req.body;
    if (!produto_id || !motivo_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, motivo, quantidade e data são obrigatórios.' });
    }
    const produto = await dbProdutos.buscarPorId(produto_id);
    const valor_total = produto?.custo ? (produto.custo * quantidade) : null;
    const perda = await dbPerdas.criar({
      produto_id, motivo_id, quantidade, valor_total,
      data, observacao, usuario_id: req.usuario.id, secao,
      funcionario_cobrado_id: funcionario_cobrado_id || null,
      valor_cobrado: valor_cobrado || null,
    });
    res.status(201).json(perda);
  } catch (err) { erroInterno(res, err, 'POST /perdas'); }
});

router.put('/perdas/:id', autenticar, verificarPermissao('editar_perda'), async (req, res) => {
  try {
    const { produto_id, motivo_id, quantidade, data, observacao, funcionario_cobrado_id, valor_cobrado } = req.body;
    if (!produto_id || !motivo_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, motivo, quantidade e data são obrigatórios.' });
    }
    const produto = await dbProdutos.buscarPorId(produto_id);
    const valor_total = produto?.custo ? (produto.custo * quantidade) : null;
    const perda = await dbPerdas.atualizar(req.params.id, {
      produto_id, motivo_id, quantidade, valor_total, data, observacao,
      funcionario_cobrado_id: funcionario_cobrado_id || null,
      valor_cobrado: valor_cobrado || null,
    });
    if (!perda) return res.status(404).json({ erro: 'Registro não encontrado.' });
    res.json(perda);
  } catch (err) { erroInterno(res, err, 'PUT /perdas'); }
});

router.delete('/perdas/:id', autenticar, verificarPermissao('excluir_perda'), async (req, res) => {
  try {
    await dbPerdas.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) { erroInterno(res, err, 'DELETE /perdas'); }
});

router.post('/perdas/recalcular-custos', autenticar, apenasAdmin, async (req, res) => {
  try {
    const { secao } = req.body;
    const atualizados = await dbPerdas.recalcularCustos(secao || null);
    res.json({ ok: true, atualizados });
  } catch (err) { erroInterno(res, err, 'POST /perdas/recalcular-custos'); }
});

// ============================================================
// PRODUÇÃO
// ============================================================
router.get('/producao', autenticar, async (req, res) => {
  try {
    const { dataInicio, dataFim, produto_id, secao } = req.query;
    const lista = await dbProducao.listar({ dataInicio, dataFim, produto_id, secao });
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /producao'); }
});

router.post('/producao', autenticar, async (req, res) => {
  try {
    const { produto_id, quantidade, data, observacao, secao } = req.body;
    if (!produto_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, quantidade e data são obrigatórios.' });
    }
    const registro = await dbProducao.criar({
      produto_id, quantidade, data, observacao, usuario_id: req.usuario.id, secao,
    });
    res.status(201).json(registro);
  } catch (err) { erroInterno(res, err, 'POST /producao'); }
});

router.put('/producao/:id', autenticar, verificarPermissao('editar_producao'), async (req, res) => {
  try {
    const { produto_id, quantidade, data, observacao } = req.body;
    if (!produto_id || !quantidade || !data) {
      return res.status(400).json({ erro: 'Produto, quantidade e data são obrigatórios.' });
    }
    const registro = await dbProducao.atualizar(req.params.id, { produto_id, quantidade, data, observacao });
    if (!registro) return res.status(404).json({ erro: 'Registro não encontrado.' });
    res.json(registro);
  } catch (err) { erroInterno(res, err, 'PUT /producao'); }
});

router.delete('/producao/:id', autenticar, verificarPermissao('excluir_producao'), async (req, res) => {
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
    const secao = req.query.secao || null;
    const [resumo, topProdutos, porMotivo, comparativo] = await Promise.all([
      dbPerdas.resumoDashboard(secao),
      dbPerdas.topProdutosPerdidos(5, secao),
      dbPerdas.perdasPorMotivo(secao),
      dbProducao.comparativo(secao),
    ]);
    res.json({ resumo, topProdutos, porMotivo, comparativo });
  } catch (err) { erroInterno(res, err, 'GET /dashboard'); }
});

// ============================================================
// RELATÓRIO — exportar para CSV (abre direto no Excel)
// ============================================================
router.get('/relatorio/exportar', autenticar, verificarPermissao('exportar_relatorio'), async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo = 'perdas', secao } = req.query;
    const sufixo = secao === 'acougue' ? 'acougue' : 'padaria';

    let csv, nomeArquivo;

    if (tipo === 'producao') {
      const producao = await dbProducao.listar({ dataInicio, dataFim, secao });
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
      nomeArquivo = `producao-${sufixo}.csv`;
    } else {
      const perdas  = await dbPerdas.listar({ dataInicio, dataFim, secao });
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
      nomeArquivo = `perdas-${sufixo}.csv`;
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

    // 1. Wikipedia — imagem precisa do artigo correto (quando mapeado)
    if (mapa?.wiki) {
      const url = await imgWikipedia(mapa.wiki.lang, mapa.wiki.titulo);
      if (url) resultados.push(url);
    }

    // 2. Google Custom Search — busca em português, biasado para Brasil
    //    Usa o nome original do produto (em PT) para encontrar conteúdo brasileiro
    const faltamGoogle = 6 - resultados.length;
    if (faltamGoogle > 0) {
      const googleUrls = await imgGoogle(q, faltamGoogle + 2);
      for (const url of googleUrls) {
        if (!resultados.includes(url)) resultados.push(url);
        if (resultados.length >= 6) break;
      }
    }

    // 3. Pixabay — fallback quando Google não retornar resultados suficientes
    if (resultados.length < 3) {
      const termoPix = mapa?.pixabay || q;
      const pixabayUrls = await imgPixabay(termoPix, 8);
      for (const url of pixabayUrls) {
        if (!resultados.includes(url)) resultados.push(url);
        if (resultados.length >= 6) break;
      }
    }

    res.json({ imagens: resultados });
  } catch (err) { erroInterno(res, err, 'GET /imagens/buscar'); }
});

// ============================================================
// FUNCIONÁRIOS (cobrados por negligência — sem acesso ao sistema)
// ============================================================
router.get('/funcionarios', autenticar, async (req, res) => {
  try {
    const { secao, todos } = req.query;
    const lista = await dbFuncionarios.listar(todos !== 'true', secao || null);
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /funcionarios'); }
});

router.post('/funcionarios', autenticar, verificarPermissao('gerenciar_funcionarios'), async (req, res) => {
  try {
    const { nome, funcao, secao } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const f = await dbFuncionarios.criar({ nome, funcao, secao });
    res.status(201).json(f);
  } catch (err) { erroInterno(res, err, 'POST /funcionarios'); }
});

router.put('/funcionarios/:id', autenticar, verificarPermissao('gerenciar_funcionarios'), async (req, res) => {
  try {
    const f = await dbFuncionarios.atualizar(req.params.id, req.body);
    if (!f) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    res.json(f);
  } catch (err) { erroInterno(res, err, 'PUT /funcionarios'); }
});

router.delete('/funcionarios/:id', autenticar, verificarPermissao('gerenciar_funcionarios'), async (req, res) => {
  try {
    await dbFuncionarios.excluir(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'Este funcionário possui perdas vinculadas e não pode ser excluído. Use "Editar → Inativo".' });
    }
    erroInterno(res, err, 'DELETE /funcionarios');
  }
});

// ============================================================
// USUÁRIOS
// ============================================================
router.get('/usuarios', autenticar, verificarPermissao('gerenciar_usuarios'), async (req, res) => {
  try {
    const lista = await dbUsuarios.listar();
    res.json(lista);
  } catch (err) { erroInterno(res, err, 'GET /usuarios'); }
});

router.post('/usuarios', autenticar, verificarPermissao('gerenciar_usuarios'), async (req, res) => {
  try {
    const { nome, email, senha, role, acesso } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await dbUsuarios.criar({ nome, email, senha: senhaHash, role, acesso });
    res.status(201).json(usuario);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    erroInterno(res, err, 'POST /usuarios');
  }
});

router.delete('/usuarios/:id', autenticar, verificarPermissao('gerenciar_usuarios'), async (req, res) => {
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

router.put('/usuarios/:id', autenticar, verificarPermissao('gerenciar_usuarios'), async (req, res) => {
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

// PUT /api/usuarios/:id/permissoes — somente admin pode alterar permissões
router.put('/usuarios/:id/permissoes', autenticar, apenasAdmin, async (req, res) => {
  try {
    const resultado = await dbUsuarios.atualizarPermissoes(req.params.id, req.body);
    if (!resultado) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ ok: true });
  } catch (err) { erroInterno(res, err, 'PUT /usuarios/permissoes'); }
});

module.exports = router;
