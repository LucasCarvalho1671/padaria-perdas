/* ── combobox.js — campo pesquisável reutilizável ─────────── */

/**
 * Gera o HTML de um combobox pesquisável.
 * @param {string} idHidden    - id do <input type="hidden"> que guarda o valor selecionado
 * @param {string} placeholder - texto exibido no campo enquanto vazio
 * @param {Array}  opcoes      - [{ value, label }] ou [{ disabled: true }] para separador visual
 */
function htmlCombobox(idHidden, placeholder, opcoes) {
  const itens = opcoes.map(o =>
    o.disabled
      ? `<div class="combo-sep"></div>`
      : `<div class="combo-opcao" data-value="${o.value}">${o.label}</div>`
  ).join('');

  return `
    <div class="combo-wrap" data-hidden="${idHidden}">
      <input type="text" class="combo-input" placeholder="${placeholder}"
             autocomplete="off" spellcheck="false" />
      <div class="combo-dropdown">${itens}</div>
    </div>
    <input type="hidden" id="${idHidden}" />
  `;
}

/**
 * Ativa todos os comboboxes ainda não inicializados no DOM.
 * Deve ser chamado sempre após inserir um htmlCombobox() no DOM.
 */
function ativarComboboxes() {
  document.querySelectorAll('.combo-wrap:not([data-init])').forEach(wrap => {
    wrap.setAttribute('data-init', '1');

    const input    = wrap.querySelector('.combo-input');
    const dropdown = wrap.querySelector('.combo-dropdown');
    const hidden   = document.getElementById(wrap.dataset.hidden);

    // ── Abre o dropdown ──────────────────────────────────────
    const abrir = () => {
      // Fecha outros dropdowns abertos na página
      document.querySelectorAll('.combo-dropdown.aberto').forEach(d => {
        if (d !== dropdown) d.classList.remove('aberto');
      });
      dropdown.classList.add('aberto');
    };

    // ── Fecha o dropdown ─────────────────────────────────────
    const fechar = () => {
      dropdown.classList.remove('aberto');
      dropdown.querySelectorAll('.combo-ativa').forEach(o => o.classList.remove('combo-ativa'));
    };

    // Remove acentos para busca sem acento funcionar (ex: "pao" achar "Pão")
    const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

    // ── Filtra opções enquanto o usuário digita ───────────────
    const filtrar = (termo) => {
      const busca = semAcento(termo.toLowerCase().replace(/★/g, '').trim());
      let temFav = false, temRest = false;

      dropdown.querySelectorAll('.combo-opcao').forEach(opt => {
        const texto   = semAcento(opt.textContent.toLowerCase().replace(/★/g, '').trim());
        const visivel = !busca || texto.includes(busca);
        opt.classList.toggle('combo-oculto', !visivel);
        opt.classList.remove('combo-ativa');
        if (visivel) {
          if (opt.textContent.trim().startsWith('★')) temFav = true;
          else temRest = true;
        }
      });

      // Oculta separador se não há favoritos e não-favoritos simultaneamente visíveis
      const sep = dropdown.querySelector('.combo-sep');
      if (sep) sep.classList.toggle('combo-oculto', !(temFav && temRest));
    };

    // ── Seleciona uma opção ───────────────────────────────────
    const selecionar = (opcao) => {
      input.value  = opcao.textContent.trim();
      hidden.value = opcao.dataset.value;
      fechar();
      // Dispara change no hidden para que os listeners existentes funcionem
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Abre e filtra ao focar/clicar
    input.addEventListener('focus', () => { abrir(); filtrar(input.value); });
    input.addEventListener('click', () => { abrir(); filtrar(input.value); });

    // Filtra enquanto digita e invalida seleção anterior
    input.addEventListener('input', () => {
      abrir();
      filtrar(input.value);
      hidden.value = ''; // limpa seleção ao editar o texto manualmente
    });

    // Clique com mouse em uma opção (mousedown para não perder o focus do input)
    dropdown.addEventListener('mousedown', (e) => {
      const opt = e.target.closest('.combo-opcao');
      if (opt) { e.preventDefault(); selecionar(opt); }
    });

    // Navegação por teclado: ↑ ↓ Enter Esc
    input.addEventListener('keydown', (e) => {
      const visiveis = [...dropdown.querySelectorAll('.combo-opcao:not(.combo-oculto)')];
      const atual    = dropdown.querySelector('.combo-ativa');
      const idx      = visiveis.indexOf(atual);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        abrir();
        const prox = visiveis[idx + 1] ?? visiveis[0];
        if (prox) {
          if (atual) atual.classList.remove('combo-ativa');
          prox.classList.add('combo-ativa');
          prox.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const ant = idx > 0 ? visiveis[idx - 1] : visiveis[visiveis.length - 1];
        if (ant) {
          if (atual) atual.classList.remove('combo-ativa');
          ant.classList.add('combo-ativa');
          ant.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        if (dropdown.classList.contains('aberto')) {
          e.preventDefault();
          if (atual) selecionar(atual);
        }
      } else if (e.key === 'Escape') {
        fechar();
        input.blur();
      }
    });

    // Fecha ao clicar fora do combobox
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) fechar();
    }, true);
  });
}
