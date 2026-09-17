// ===========================================================
// Cafeteria da Nuvem — cardápio, carrinho e pedido
// Dados guardados no localStorage do navegador (site 100% estático)
// ===========================================================

const PRODUCTS = [
  {
    id: 'cafe-expresso',
    name: 'Café Expresso',
    desc: 'Tiro curto, encorpado, com crema espessa. Do jeito que café bom tem que ser.',
    price: 6.5,
  },
  {
    id: 'cafe-com-leite',
    name: 'Café com Leite',
    desc: 'Metade café coado, metade leite quente. Clássico e reconfortante.',
    price: 7.5,
  },
  {
    id: 'cappuccino',
    name: 'Café com Cappuccino',
    desc: 'Espresso, leite vaporizado e uma camada generosa de espuma com canela.',
    price: 9.0,
  },
  {
    id: 'chantili',
    name: 'Café com Chantili',
    desc: 'Espresso adoçado coberto por chantili fresco e um toque de cacau.',
    price: 10.5,
  },
  {
    id: 'croissant-queijo',
    name: 'Croissant com Queijo',
    desc: 'Folhado na hora, recheado com queijo derretido. Servido quente.',
    price: 9.5,
  },
  {
    id: 'brownie',
    name: 'Brownie',
    desc: 'Massa densa de chocolate meio amargo, com casquinha crocante por fora.',
    price: 8.0,
  },
  {
    id: 'chocolate-quente',
    name: 'Chocolate Quente',
    desc: 'Chocolate derretido com leite vaporizado, cremoso do primeiro ao último gole.',
    price: 9.0,
  },
];

const CART_KEY = 'cafeNuvemCart';
const ORDER_KEY = 'cafeNuvemLastOrder';

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartItemsWithData(cart) {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === id), qty }))
    .filter((item) => item.id);
}

function cartTotal(cart) {
  return cartItemsWithData(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

// ---------------------------------------------------------
// Página de produtos
// ---------------------------------------------------------
function initMenuPage() {
  const list = document.getElementById('menu-list');
  const cartBar = document.getElementById('cart-bar');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalList = document.getElementById('modal-list');
  const modalTotalEl = document.getElementById('modal-total-value');

  // quantidade selecionada antes de adicionar ao carrinho (por produto)
  const pending = {};
  PRODUCTS.forEach((p) => (pending[p.id] = 1));

  list.innerHTML = PRODUCTS.map((p) => `
    <div class="menu-item" data-id="${p.id}">
      <div class="menu-item-top">
        <h3>${p.name}</h3>
        <div class="menu-item-price">${formatBRL(p.price)}</div>
      </div>
      <p class="menu-item-desc">${p.desc}</p>
      <div class="menu-item-controls">
        <div class="qty">
          <button type="button" data-action="dec" aria-label="Diminuir quantidade">−</button>
          <span data-role="qty-value">1</span>
          <button type="button" data-action="inc" aria-label="Aumentar quantidade">+</button>
        </div>
        <button type="button" class="add-btn" data-action="add">Adicionar à lista</button>
      </div>
    </div>
  `).join('');

  function updateCartBar() {
    const cart = readCart();
    const count = cartCount(cart);
    const total = cartTotal(cart);
    cartCountEl.textContent = count === 1 ? '1 item' : `${count} itens`;
    cartTotalEl.textContent = formatBRL(total);
    cartBar.classList.toggle('visible', count > 0);
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const itemEl = btn.closest('.menu-item');
    const id = itemEl.dataset.id;
    const qtyEl = itemEl.querySelector('[data-role="qty-value"]');

    if (btn.dataset.action === 'inc') {
      pending[id] = Math.min(pending[id] + 1, 20);
      qtyEl.textContent = pending[id];
    } else if (btn.dataset.action === 'dec') {
      pending[id] = Math.max(pending[id] - 1, 1);
      qtyEl.textContent = pending[id];
    } else if (btn.dataset.action === 'add') {
      const cart = readCart();
      cart[id] = (cart[id] || 0) + pending[id];
      writeCart(cart);
      updateCartBar();

      btn.textContent = 'Adicionado';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = 'Adicionar';
        btn.classList.remove('added');
      }, 1100);

      pending[id] = 1;
      qtyEl.textContent = 1;
    }
  });

  function renderModal() {
    const cart = readCart();
    const items = cartItemsWithData(cart);

    if (items.length === 0) {
      modalList.innerHTML = '<p class="modal-empty">Seu pedido ainda está vazio.</p>';
    } else {
      modalList.innerHTML = items.map((item) => `
        <div class="row" data-id="${item.id}">
          <span class="name">${item.name}<span class="qty-x">× ${item.qty}</span></span>
          <span class="price">${formatBRL(item.price * item.qty)}</span>
          <button type="button" class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="Remover ${item.name} do pedido">Remover</button>
        </div>
      `).join('');
    }
    modalTotalEl.textContent = formatBRL(cartTotal(cart));
  }

  modalList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="remove"]');
    if (!btn) return;
    const cart = readCart();
    delete cart[btn.dataset.id];
    writeCart(cart);
    updateCartBar();
    renderModal();
  });

  function openModal() {
    renderModal();
    modalOverlay.classList.add('open');
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  document.getElementById('btn-finalizar').addEventListener('click', openModal);
  document.getElementById('btn-acrescentar').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('btn-confirmar').addEventListener('click', () => {
    const cart = readCart();
    const items = cartItemsWithData(cart);
    if (items.length === 0) return;

    const order = {
      number: Math.floor(1000 + Math.random() * 9000),
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total: cartTotal(cart),
      date: new Date().toISOString(),
    };
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    localStorage.removeItem(CART_KEY);
    window.location.href = 'confirmacao.html';
  });

  updateCartBar();
}

// ---------------------------------------------------------
// Página de confirmação
// ---------------------------------------------------------
function initConfirmPage() {
  const wrap = document.getElementById('confirm-wrap');
  const raw = localStorage.getItem(ORDER_KEY);
  const order = raw ? JSON.parse(raw) : null;

  if (!order) {
    wrap.innerHTML = `
      <div class="confirm-mark">☁</div>
      <h1>Nenhum pedido por aqui</h1>
      <p class="confirm-order-no">Volte ao cardápio para montar seu pedido.</p>
      <a class="btn btn-primary" href="produtos.html">Ver cardápio</a>
    `;
    return;
  }

  const rows = order.items.map((i) => `
    <div class="row">
      <span>${i.name} <span style="color:var(--ink-muted)">× ${i.qty}</span></span>
      <span>${formatBRL(i.price * i.qty)}</span>
    </div>
  `).join('');

  wrap.innerHTML = `
    <div class="confirm-mark">✓</div>
    <h1>Pedido confirmado</h1>
    <p class="confirm-order-no">Número do pedido <strong>#${order.number}</strong> — retire no balcão em cerca de 10 minutos.</p>
    <div class="confirm-list">${rows}</div>
    <div class="confirm-total">
      <span>Total</span>
      <span>${formatBRL(order.total)}</span>
    </div>
    <a class="btn btn-primary" href="produtos.html">Fazer novo pedido</a>
  `;
}

// ---------------------------------------------------------
if (document.getElementById('menu-list')) {
  initMenuPage();
} else if (document.getElementById('confirm-wrap')) {
  initConfirmPage();
}
