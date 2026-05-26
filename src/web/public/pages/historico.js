async function renderHistorico(el) {
  el.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const [produtos, motivos] = await Promise.all([
      fetch('/api/produtos').then(r => r.json()),
      fetch('/api/motivos').then(r => r.json()),
    ]);

    el.innerHTML = `
      <div class="filtros">
        <div class="campo">
          <label>De</label>
          <input type="date" id="h-inicio" />
        </div>
        <div class="campo">
          <label>Até</label>
          <input type="date" id="h-fim" />
        </div>
        <div class="campo">
          <label>Produto</label>
          <select id="h-produto">
            <option value="">Todos</option>
            ${produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Motivo</label>
          <select id="h-motivo">
            <option value="">Todos</option>
            ${motivos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primario" id="btn-buscar">Buscar</button>
        <button class="btn btn-secundario" id="btn-exportar">⬇ Exportar Excel</button>
      </div>

      <div class="card">
        <div class="secao-titulo">📂 Histórico de perdas</div>
        <div id="lista-historico" class="tabela-wrapper">
          <div class="vazio">Selecione os filtros e clique em Buscar.</div>
        </div>
      </div>
    `;

    const buscar = async () => {
      const params = new URLSearchParams();
      const ini  = document.getElementById('h-inicio').value;
      const fim  = document.getElementById('h-fim').value;
      const prod = document.getElementById('h-produto').value;
      const mot  = document.getElementById('h-motivo').value;
      if (ini)  params.append('dataInicio', ini);
      if (fim)  params.append('dataFim',    fim);
      if (prod) params.append('produto_id', prod);
      if (mot)  params.append('motivo_id',  mot);

      const lista = document.getElementById('lista-historico');
      lista.innerHTML = '<div class="carregando">Buscando...</div>';

      const perdas = await fetch('/api/perdas?' + params).then(r => r.json());

      if (perdas.length === 0) {
        lista.innerHTML = '<div class="vazio">Nenhuma perda encontrada.</div>';
        return;
      }

      const fmt   = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 3 });
      const moeda = v => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const fmtData = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

      lista.innerHTML = `
        <table>
          <thead><tr>
            <th>Data</th><th>Produto</th><th>Qtd</th><th>Valor</th><th>Motivo</th><th>Obs.</th><th>Por</th><th></th>
          </tr></thead>
          <tbody>
            ${perdas.map(p => `
              <tr>
                <td>${fmtData(p.data)}</td>
                <td>
                  ${p.imagem_url ? `<img src="${p.imagem_url}" class="produto-thumb" />` : ''}
                  ${p.produto_nome}
                </td>
                <td>${fmt(p.quantidade)} ${p.unidade}</td>
                <td>${moeda(p.valor_total)}</td>
                <td>${p.motivo_nome}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.observacao || '—'}</td>
                <td>${p.usuario_nome}</td>
                <td>
                  <button class="btn btn-perigo btn-sm" onclick="excluirPerda(${p.id})">✕</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    };

    document.getElementById('btn-buscar').onclick = buscar;

    document.getElementById('btn-exportar').onclick = () => {
      const params = new URLSearchParams();
      const ini = document.getElementById('h-inicio').value;
      const fim = document.getElementById('h-fim').value;
      if (ini) params.append('dataInicio', ini);
      if (fim) params.append('dataFim',    fim);
      window.location.href = '/api/relatorio/exportar?' + params;
    };

    // Carrega com data de hoje por padrão
    buscar();

  } catch (err) {
    el.innerHTML = `<div class="alerta alerta-erro">Erro: ${err.message}</div>`;
  }
}

async function excluirPerda(id) {
  if (!confirm('Deseja excluir este registro?')) return;
  try {
    await fetch(`/api/perdas/${id}`, { method: 'DELETE' });
    renderHistorico(document.getElementById('conteudo'));
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}
