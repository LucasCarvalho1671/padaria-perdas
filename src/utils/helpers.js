// Formata valor em reais: 1234.5 → "R$ 1.234,50"
function formatarMoeda(valor) {
  if (valor == null) return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata data ISO para pt-BR: "2024-01-15" → "15/01/2024"
function formatarData(data) {
  if (!data) return '—';
  const d = new Date(data + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

// Retorna a data de hoje no formato YYYY-MM-DD
function hoje() {
  return new Date().toISOString().split('T')[0];
}

// Responde erro 500 sem expor detalhes internos ao cliente
function erroInterno(res, err, contexto = 'API') {
  console.error(`[ERRO] ${contexto}:`, err?.message || err);
  res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
}

module.exports = { formatarMoeda, formatarData, hoje, erroInterno };
