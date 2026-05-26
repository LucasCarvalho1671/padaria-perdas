// dialogs.js — substitui confirm() e alert() nativos por modais com CSS do app

(function () {
  const el = document.createElement('div');
  el.id = 'dialog-overlay';
  el.className = 'dialog-overlay';
  el.innerHTML = `
    <div class="dialog-box">
      <div class="dialog-icone" id="dialog-icone"></div>
      <div class="dialog-mensagem" id="dialog-mensagem"></div>
      <div class="dialog-botoes" id="dialog-botoes"></div>
    </div>
  `;
  document.body.appendChild(el);
})();

// Confirmação com dois botões (OK / Cancelar) — retorna Promise<boolean>
// Uso: const ok = await confirmar('Tem certeza?', { okTexto: 'Excluir', okClasse: 'btn-perigo' })
function confirmar(mensagem, { okTexto = 'Confirmar', okClasse = 'btn-perigo' } = {}) {
  return new Promise((resolve) => {
    document.getElementById('dialog-icone').textContent    = '⚠️';
    document.getElementById('dialog-mensagem').innerHTML   = mensagem;
    document.getElementById('dialog-botoes').innerHTML     = `
      <button class="btn ${okClasse}" id="dialog-ok">${okTexto}</button>
      <button class="btn btn-secundario" id="dialog-cancelar">Cancelar</button>
    `;
    document.getElementById('dialog-overlay').classList.add('aberto');

    document.getElementById('dialog-ok').onclick = () => {
      document.getElementById('dialog-overlay').classList.remove('aberto');
      resolve(true);
    };
    document.getElementById('dialog-cancelar').onclick = () => {
      document.getElementById('dialog-overlay').classList.remove('aberto');
      resolve(false);
    };
  });
}

// Alerta simples só com OK — retorna Promise<void>
// tipo: 'erro' | 'aviso' | 'info'
function alertar(mensagem, tipo = 'erro') {
  return new Promise((resolve) => {
    const icone = tipo === 'erro' ? '❌' : tipo === 'aviso' ? '⚠️' : 'ℹ️';
    document.getElementById('dialog-icone').textContent   = icone;
    document.getElementById('dialog-mensagem').innerHTML  = mensagem;
    document.getElementById('dialog-botoes').innerHTML    = `
      <button class="btn btn-primario" id="dialog-ok">OK</button>
    `;
    document.getElementById('dialog-overlay').classList.add('aberto');

    document.getElementById('dialog-ok').onclick = () => {
      document.getElementById('dialog-overlay').classList.remove('aberto');
      resolve();
    };
  });
}
