const DEFAULT_MENU = [
  { id: 1, name: "Paradise Smash Burger", category: "Burgers", price: 680, desc: "Double beef patty, cheddar slice, house smoky sauce.", available: true },
  { id: 2, name: "Crispy Zinger Stack", category: "Burgers", price: 590, desc: "Crunchy chicken fillet, jalapeno mayo, iceberg.", available: true },
  { id: 3, name: "Alfredo Penne Pasta", category: "Main Course", price: 850, desc: "Creamy parmesan sauce with grilled herb chicken.", available: true },
  { id: 4, name: "Peri-Peri Half Chicken", category: "Main Course", price: 980, desc: "Flame-grilled chicken served with garlic rice.", available: true },
  { id: 5, name: "Loaded Masala Fries", category: "Sides", price: 340, desc: "Crispy skin-on fries topped with cheese & herbs.", available: true },
  { id: 6, name: "Garlic Bread (4 Pcs)", category: "Sides", price: 260, desc: "Toasted herb butter baguette slices.", available: true },
  { id: 7, name: "Mint Margarita", category: "Drinks", price: 240, desc: "Fresh mint, lime juice, crushed ice.", available: true },
  { id: 8, name: "Cold Brew Peach Tea", category: "Drinks", price: 280, desc: "Chilled black tea infused with white peach.", available: true }
];

const STORAGE_KEYS = {
  MENU: "pp_menu_v1",
  ORDERS: "pp_orders_v1"
};

let menu = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU)) || DEFAULT_MENU;
let orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
let cart = [];
let selectedCategory = "All";

const el = (id) => document.getElementById(id);

function saveState() {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function showToast(msg) {
  const toast = el("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2400);
}

function getSmartRecommendation() {
  const hour = new Date().getHours();
  const counts = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      counts[item.name] = (counts[item.name] || 0) + item.qty;
    });
  });

  const sortedByPopularity = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sortedByPopularity.length > 0) {
    return `Assistant Pick: "${sortedByPopularity[0][0]}" is our most ordered item today (${sortedByPopularity[0][1]} served).`;
  }

  if (hour >= 12 && hour <= 16) {
    return "Lunch Hour Suggestion: Pair Paradise Smash Burger with Mint Margarita for a quick combo.";
  }
  return "Chef's Evening Highlight: Alfredo Penne Pasta & Loaded Masala Fries are trending tonight.";
}

function getCartPairingSuggestion() {
  if (cart.length === 0) return null;

  const hasMainOrBurger = cart.some(c => c.category === "Burgers" || c.category === "Main Course");
  const hasDrink = cart.some(c => c.category === "Drinks");
  const hasSide = cart.some(c => c.category === "Sides");

  if (hasMainOrBurger && !hasDrink) {
    return menu.find(m => m.category === "Drinks" && m.available) || null;
  }
  if (hasMainOrBurger && !hasSide) {
    return menu.find(m => m.category === "Sides" && m.available) || null;
  }
  return null;
}

function renderMenu() {
  const query = el("searchInput").value.trim().toLowerCase();
  el("aiSmartBanner").textContent = getSmartRecommendation();

  const filtered = menu.filter(item => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  el("menuGrid").innerHTML = filtered.map(item => `
    <article class="dish-card ${item.available ? "" : "sold-out"}">
      <div>
        <span class="dish-tag">${item.category}</span>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
      </div>
      <div class="dish-bottom">
        <span class="price">PKR ${item.price}</span>
        <button class="add-btn" ${item.available ? "" : "disabled"} onclick="addToCart(${item.id})">
          ${item.available ? "+ Add" : "Sold Out"}
        </button>
      </div>
    </article>
  `).join("");
}

function addToCart(itemId) {
  const item = menu.find(m => m.id === itemId);
  if (!item || !item.available) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  renderCart();
}

function updateQty(itemId, delta) {
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;

  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  renderCart();
}

function renderCart() {
  const list = el("cartItems");
  const pairingBox = el("pairingBox");
  const placeBtn = el("placeOrderBtn");

  if (cart.length === 0) {
    list.innerHTML = `<p class="empty-msg">No items added yet.</p>`;
    pairingBox.classList.add("hidden");
    el("cartTotal").textContent = "PKR 0";
    placeBtn.disabled = true;
    return;
  }

  let total = 0;
  list.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    return `
      <div class="cart-row">
        <div>
          <strong>${item.name}</strong><br />
          <small>PKR ${item.price} x ${item.qty}</small>
        </div>
        <div class="qty-controls">
          <button onclick="updateQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `;
  }).join("");

  const suggestion = getCartPairingSuggestion();
  if (suggestion) {
    pairingBox.classList.remove("hidden");
    pairingBox.innerHTML = `
      <span>Add <strong>${suggestion.name}</strong> (PKR ${suggestion.price})?</span>
      <button onclick="addToCart(${suggestion.id})">+ Add</button>
    `;
  } else {
    pairingBox.classList.add("hidden");
  }

  el("cartTotal").textContent = `PKR ${total}`;
  placeBtn.disabled = false;
}

function placeOrder() {
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const newOrder = {
    id: "ORD-" + String(Date.now()).slice(-4),
    table: el("tableSelect").value,
    items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
    note: el("orderNote").value.trim(),
    total,
    status: "Pending",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  orders.unshift(newOrder);
  saveState();

  cart = [];
  el("orderNote").value = "";
  renderCart();
  renderMenu();
  showToast(`Order ${newOrder.id} sent to kitchen!`);
}

function cycleOrderStatus(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (order.status === "Pending") order.status = "Preparing";
  else if (order.status === "Preparing") order.status = "Served";

  saveState();
  renderManagerDashboard();
}

function toggleStock(itemId) {
  const item = menu.find(m => m.id === itemId);
  if (!item) return;
  item.available = !item.available;
  saveState();
  renderManagerDashboard();
  renderMenu();
}

function renderManagerDashboard() {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeCount = orders.filter(o => o.status !== "Served").length;

  const itemTally = {};
  orders.forEach(o => o.items.forEach(i => {
    itemTally[i.name] = (itemTally[i.name] || 0) + i.qty;
  }));
  const topEntry = Object.entries(itemTally).sort((a, b) => b[1] - a[1])[0];

  el("statOrders").textContent = orders.length;
  el("statActive").textContent = activeCount;
  el("statRevenue").textContent = `PKR ${revenue.toLocaleString()}`;
  el("statTopItem").textContent = topEntry ? `${topEntry[0]} (${topEntry[1]})` : "—";

  const avgOrder = orders.length ? Math.round(revenue / orders.length) : 0;
  el("managerInsightStrip").textContent = orders.length
    ? `Operational Insight: Average ticket size is PKR ${avgOrder}. ${activeCount} order(s) currently need kitchen attention.`
    : "Operational Insight: Waiting for incoming table orders to generate live demand metrics.";

  const queueEl = el("orderQueue");
  if (orders.length === 0) {
    queueEl.innerHTML = `<p class="empty-msg">No orders placed yet.</p>`;
  } else {
    queueEl.innerHTML = orders.map(order => `
      <div class="order-ticket">
        <div class="ticket-top">
          <span>${order.id} • ${order.table} (${order.time})</span>
          <span class="badge ${order.status}">${order.status}</span>
        </div>
        <div class="ticket-items">
          ${order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
          ${order.note ? `<br/><em>Note: ${order.note}</em>` : ""}
        </div>
        <div class="ticket-actions">
          <strong>PKR ${order.total}</strong>
          ${order.status !== "Served"
            ? `<button onclick="cycleOrderStatus('${order.id}')">Mark as ${order.status === "Pending" ? "Preparing" : "Served"}</button>`
            : `<span>Completed</span>`}
        </div>
      </div>
    `).join("");
  }

  el("stockList").innerHTML = menu.map(item => `
    <div class="stock-row">
      <span>${item.name} (PKR ${item.price})</span>
      <button class="ghost-btn" onclick="toggleStock(${item.id})">
        ${item.available ? "In Stock" : "Out of Stock"}
      </button>
    </div>
  `).join("");
}

el("btnCustomerView").addEventListener("click", () => {
  el("btnCustomerView").classList.add("active");
  el("btnManagerView").classList.remove("active");
  el("customerSection").classList.remove("hidden");
  el("managerSection").classList.add("hidden");
});

el("btnManagerView").addEventListener("click", () => {
  el("btnManagerView").classList.add("active");
  el("btnCustomerView").classList.remove("active");
  el("managerSection").classList.remove("hidden");
  el("customerSection").classList.add("hidden");
  renderManagerDashboard();
});

el("tableSelect").addEventListener("change", (e) => {
  el("activeTableLabel").textContent = e.target.value;
});

el("searchInput").addEventListener("input", renderMenu);

el("categoryBar").addEventListener("click", (e) => {
  if (!e.target.classList.contains("cat-chip")) return;
  document.querySelectorAll(".cat-chip").forEach(btn => btn.classList.remove("active"));
  e.target.classList.add("active");
  selectedCategory = e.target.dataset.cat;
  renderMenu();
});

el("placeOrderBtn").addEventListener("click", placeOrder);

el("clearCompletedBtn").addEventListener("click", () => {
  orders = orders.filter(o => o.status !== "Served");
  saveState();
  renderManagerDashboard();
});

el("addMenuForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const newItem = {
    id: Date.now(),
    name: el("itemName").value.trim(),
    category: el("itemCat").value,
    price: Number(el("itemPrice").value),
    desc: el("itemDesc").value.trim(),
    available: true
  };
  menu.push(newItem);
  saveState();
  e.target.reset();
  renderManagerDashboard();
  renderMenu();
  showToast("New dish added to menu.");
});

renderMenu();
renderCart();
