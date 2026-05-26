const express  = require('express');
const bcrypt   = require('bcrypt');
const XLSX     = require('xlsx');
const router   = express.Router();
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
    const lista = await dbProdutos.listar();
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

// ============================================================
// MOTIVOS
// ============================================================
router.get('/motivos', autenticar, async (req, res) => {
  try {
    const lista = await dbMotivos.listar();
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
// RELATÓRIO — exportar para planilha Excel
// ============================================================
router.get('/relatorio/exportar', autenticar, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const perdas   = await dbPerdas.listar({ dataInicio, dataFim });
    const producao = await dbProducao.listar({ dataInicio, dataFim });

    const wbPerdas = perdas.map(p => ({
      Data:       p.data,
      Produto:    p.produto_nome,
      Unidade:    p.unidade,
      Quantidade: Number(p.quantidade),
      'Valor (R$)': p.valor_total ? Number(p.valor_total) : '',
      Motivo:     p.motivo_nome,
      Observação: p.observacao || '',
      Registrado: p.usuario_nome,
    }));

    const wbProducao = producao.map(p => ({
      Data:       p.data,
      Produto:    p.produto_nome,
      Unidade:    p.unidade,
      Quantidade: Number(p.quantidade),
      Observação: p.observacao || '',
      Registrado: p.usuario_nome,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wbPerdas),   'Perdas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wbProducao), 'Produção');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-padaria.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { erroInterno(res, err, 'GET /relatorio/exportar'); }
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

router.put('/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuario = await dbUsuarios.atualizar(req.params.id, req.body);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) { erroInterno(res, err, 'PUT /usuarios'); }
});

module.exports = router;
