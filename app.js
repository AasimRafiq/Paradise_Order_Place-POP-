const INITIAL_CATALOG = [
  { id: 101, name: "Paradise Double Smash", category: "Burgers", cost: 340, price: 790, stock: 24, prepMins: 12, desc: "Aged beef patties, smoked cheddar, caramelized onions, house sauce." },
  { id: 102, name: "Fiery Zinger Crunch", category: "Burgers", cost: 280, price: 650, stock: 18, prepMins: 10, desc: "Crispy spicy chicken thigh, jalapeno aioli, pickled slaw." },
  { id: 103, name: "Truffle Alfredo Fettuccine", category: "Main Course", cost: 410, price: 960, stock: 14, prepMins: 16, desc: "Parmesan cream reduction, grilled herb chicken, black pepper." },
  { id: 104, name: "Peri-Peri Flame Half Chicken", category: "Main Course", cost: 480, price: 1120, stock: 11, prepMins: 18, desc: "Chargrilled spicy peri chicken served with aromatic garlic rice." },
  { id: 105, name: "Loaded Cheddar Masala Fries", category: "Sides", cost: 130, price: 380, stock: 30, prepMins: 7, desc: "Skin-on fries, melted cheddar, peri dust, spring onions." },
  { id: 106, name: "Roasted Garlic Herb Bread", category: "Sides", cost: 95, price: 290, stock: 22, prepMins: 6, desc: "Four toasted sourdough slices with compound herb butter." },
  { id: 107, name: "Fresh Mint Margarita", category: "Drinks", cost: 75, price: 260, stock: 35, prepMins: 4, desc: "Crushed garden mint, fresh lime, sparkling citrus blend." },
  { id: 108, name: "Peach Iced Black Tea", category: "Drinks", cost: 85, price: 290, stock: 28, prepMins: 3, desc: "Cold-brewed Ceylon tea infused with white peach nectar." }
];

const DB_KEYS = {
  CATALOG: "pp_os_catalog_v2",
  ORDERS: "pp_os_orders_v2"
};

let catalog = JSON.parse(localStorage.getItem(DB_KEYS.CATALOG)) || INITIAL_CATALOG;
let orders = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
let cart = [];
let activeCategory = "All";
let activeKdsFilter = "ALL";
let discountRate = 0;

const $ = (id) => document.getElementById(id);

function syncStorage() {
  localStorage.setItem(DB_KEYS.CATALOG, JSON.stringify(catalog));
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
}

function notify(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2500);
}

// NAVIGATION ROUTER
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("hidden"));

    btn.classList.add("active");
    const target = btn.dataset.view;
    $(target).classList.remove("hidden");

    const titles = {
      posView: ["Digital Ordering Terminal", "Table service, smart upselling, and automated KDS routing"],
      kdsView: ["Kitchen Display System (KDS)", "Live preparation queue and order fulfillment tracking"],
      analyticsView: ["Manager & AI Analytics", "Revenue metrics, margin performance, and AI operations copilot"],
      inventoryView: ["Menu & Inventory Control", "Manage dish catalog, unit costs, margins, and portion stock"]
    };
    $("pageTitle").textContent = titles[target][0];
    $("pageSubtitle").textContent = titles[target][1];

    if (target === "kdsView") renderKDS();
    if (target === "analyticsView") renderAnalytics();
    if (target === "inventoryView") renderInventory();
  });
});

// LIVE TABLE OCCUPANCY BAR
function renderTableStatus() {
  const tables = ["T-01", "T-02", "T-03", "T-04", "T-05"];
  const busyTables = new Set(
    orders.filter(o => o.status !== "Completed").map(o => o.table)
  );
  $("tableStatusBar").innerHTML = tables.map(t => `
    <span class="table-chip ${busyTables.has(t) ? "occupied" : ""}">
      ${t}: ${busyTables.has(t) ? "Active" : "Free"}
    </span>
  `).join("");

  const activeKdsCount = orders.filter(o => o.status !== "Completed").length;
  $("navKdsBadge").textContent = activeKdsCount;
}

// CATEGORY TABS & MENU GRID
function renderCategories() {
  const cats = ["All", ...new Set(catalog.map(i => i.category))];
  $("categoryTabs").innerHTML = cats.map(c => `
    <button class="cat-tab ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>
  `).join("");
}

$("categoryTabs").addEventListener("click", (e) => {
  if (!e.target.classList.contains("cat-tab")) return;
  activeCategory = e.target.dataset.cat;
  renderCategories();
  renderMenuGrid();
});

$("menuSearch").addEventListener("input", renderMenuGrid);

function getTopRecommendationBanner() {
  const tally = {};
  orders.forEach(o => o.items.forEach(i => tally[i.name] = (tally[i.name] || 0) + i.qty));
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  if (best) {
    return `Trending Today: "${best[0]}" (${best[1]} orders placed)`;
  }
  const hr = new Date().getHours();
  return hr < 17
    ? "Lunch Smart Pick: Paradise Double Smash + Mint Margarita"
    : "Dinner Smart Pick: Truffle Alfredo Fettuccine + Garlic Bread";
}

function renderMenuGrid() {
  $("dynamicRecoText").textContent = getTopRecommendationBanner();
  const q = $("menuSearch").value.trim().toLowerCase();

  const filtered = catalog.filter(item => {
    const catOk = activeCategory === "All" || item.category === activeCategory;
    const textOk = item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    return catOk && textOk;
  });

  $("dishGrid").innerHTML = filtered.map(item => `
    <article class="dish-card ${item.stock <= 0 ? "out" : ""}">
      <div>
        <div class="dish-meta">
          <span>${item.category}</span>
          <span>~${item.prepMins} min • ${item.stock} left</span>
        </div>
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
      </div>
      <div class="dish-footer">
        <span class="dish-price">PKR ${item.price}</span>
        <button class="btn-add" ${item.stock <= 0 ? "disabled" : ""} onclick="addItemToCart(${item.id})">
          ${item.stock > 0 ? "+ Add" : "Sold Out"}
        </button>
      </div>
    </article>
  `).join("");
}

// CART & BILLING ENGINE
function addItemToCart(id) {
  const dish = catalog.find(d => d.id === id);
  if (!dish || dish.stock <= 0) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= dish.stock) {
      notify(`Only ${dish.stock} portions available in stock.`);
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({ id: dish.id, name: dish.name, category: dish.category, price: dish.price, cost: dish.cost, qty: 1 });
  }
  renderCart();
}

function changeCartQty(id, delta) {
  const idx = cart.findIndex(c => c.id === id);
  if (idx === -1) return;
  const dish = catalog.find(d => d.id === id);

  const nextQty = cart[idx].qty + delta;
  if (nextQty <= 0) {
    cart.splice(idx, 1);
  } else if (dish && nextQty <= dish.stock) {
    cart[idx].qty = nextQty;
  }
  renderCart();
}

function getCrossSellItem() {
  if (cart.length === 0) return null;
  const hasEntree = cart.some(c => c.category === "Burgers" || c.category === "Main Course");
  const hasDrink = cart.some(c => c.category === "Drinks");
  const hasSide = cart.some(c => c.category === "Sides");

  if (hasEntree && !hasDrink) return catalog.find(d => d.category === "Drinks" && d.stock > 0);
  if (hasEntree && !hasSide) return catalog.find(d => d.category === "Sides" && d.stock > 0);
  return null;
}

function renderCart() {
  const box = $("cartContainer");
  const upsell = $("smartUpsellCard");

  if (cart.length === 0) {
    box.innerHTML = `<p style="color:#64748b;font-size:0.84rem;">Select dishes from the menu to build an order.</p>`;
    upsell.classList.add("hidden");
    $("subTotalVal").textContent = "PKR 0";
    $("taxVal").textContent = "PKR 0";
    $("grandTotalVal").textContent = "PKR 0";
    $("submitOrderBtn").disabled = true;
    return;
  }

  box.innerHTML = cart.map(item => `
    <div class="cart-line">
      <div>
        <strong>${item.name}</strong><br/>
        <small style="color:#64748b;">PKR ${item.price} x ${item.qty}</small>
      </div>
      <div class="qty-box">
        <button onclick="changeCartQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button onclick="changeCartQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join("");

  const pairing = getCrossSellItem();
  if (pairing) {
    upsell.classList.remove("hidden");
    upsell.innerHTML = `
      <span>AI Pairing: Add <strong>${pairing.name}</strong> (PKR ${pairing.price})?</span>
      <button onclick="addItemToCart(${pairing.id})">+ Add</button>
    `;
  } else {
    upsell.classList.add("hidden");
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.round(subtotal * discountRate);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * 0.08);
  const grandTotal = taxable + tax;

  $("subTotalVal").textContent = `PKR ${subtotal}`;
  $("taxVal").textContent = `PKR ${tax}`;
  if (discount > 0) {
    $("discountLine").classList.remove("hidden");
    $("discountVal").textContent = `-PKR ${discount}`;
  } else {
    $("discountLine").classList.add("hidden");
  }
  $("grandTotalVal").textContent = `PKR ${grandTotal}`;
  $("submitOrderBtn").disabled = false;
}

$("tableSelector").addEventListener("change", (e) => {
  $("ticketTableBadge").textContent = e.target.value;
});

$("clearCartBtn").addEventListener("click", () => {
  cart = [];
  discountRate = 0;
  $("promoInput").value = "";
  renderCart();
});

$("applyPromoBtn").addEventListener("click", () => {
  const code = $("promoInput").value.trim().toUpperCase();
  if (code === "PADUA10" || code === "POP10") {
    discountRate = 0.10;
    notify("10% Promo Discount Applied!");
  } else {
    discountRate = 0;
    notify("Invalid promo code. Try PADUA10.");
  }
  renderCart();
});

$("submitOrderBtn").addEventListener("click", () => {
  if (cart.length === 0) return;

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalCost = cart.reduce((s, i) => s + i.cost * i.qty, 0);
  const discount = Math.round(subtotal * discountRate);
  const tax = Math.round((subtotal - discount) * 0.08);
  const grandTotal = subtotal - discount + tax;
  const payMethod = document.querySelector("input[name='payMethod']:checked").value;

  // Deduct stock portions
  cart.forEach(c => {
    const dish = catalog.find(d => d.id === c.id);
    if (dish) dish.stock = Math.max(0, dish.stock - c.qty);
  });

  const orderObj = {
    id: "PP-" + Math.floor(1000 + Math.random() * 9000),
    table: $("tableSelector").value,
    customer: $("customerNameInput").value.trim() || "Walk-In Guest",
    note: $("kitchenNotesInput").value.trim(),
    items: JSON.parse(JSON.stringify(cart)),
    subtotal,
    discount,
    tax,
    total: grandTotal,
    cost: totalCost,
    payMethod,
    status: "Pending",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  orders.unshift(orderObj);
  syncStorage();

  showReceipt(orderObj);
  cart = [];
  discountRate = 0;
  $("customerNameInput").value = "";
  $("kitchenNotesInput").value = "";
  $("promoInput").value = "";

  renderCart();
  renderMenuGrid();
  renderTableStatus();
});

function showReceipt(order) {
  $("receiptContent").innerHTML = `
    <div class="receipt-paper">
      <h3 style="text-align:center;">POP PARADISE</h3>
      <p style="text-align:center;font-size:0.75rem;">Digital Tax Invoice • ${order.createdAt}</p>
      <hr style="margin:8px 0;"/>
      <p><strong>Ticket:</strong> ${order.id} (${order.table})</p>
      <p><strong>Guest:</strong> ${order.customer}</p>
      <p><strong>Payment:</strong> ${order.payMethod}</p>
      <hr style="margin:8px 0;"/>
      ${order.items.map(i => `<div style="display:flex;justify-content:space-between;"><span>${i.qty}x ${i.name}</span><span>${i.price * i.qty}</span></div>`).join("")}
      <hr style="margin:8px 0;"/>
      <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>PKR ${order.subtotal}</span></div>
      ${order.discount ? `<div style="display:flex;justify-content:space-between;"><span>Discount</span><span>-PKR ${order.discount}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;"><span>GST (8%)</span><span>PKR ${order.tax}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:4px;"><span>TOTAL</span><span>PKR ${order.total}</span></div>
    </div>
  `;
  $("receiptModal").classList.remove("hidden");
}

$("closeReceiptBtn").addEventListener("click", () => {
  $("receiptModal").classList.add("hidden");
});

// KITCHEN DISPLAY SYSTEM (KDS)
document.querySelectorAll(".filter-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeKdsFilter = btn.dataset.kds;
    renderKDS();
  });
});

function advanceKdsStatus(orderId) {
  const flow = ["Pending", "Preparing", "Ready", "Completed"];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const nextIdx = flow.indexOf(order.status) + 1;
  if (nextIdx < flow.length) {
    order.status = flow[nextIdx];
    syncStorage();
    renderKDS();
    renderTableStatus();
  }
}

function renderKDS() {
  const list = activeKdsFilter === "ALL"
    ? orders
    : orders.filter(o => o.status === activeKdsFilter);

  if (list.length === 0) {
    $("kdsBoard").innerHTML = `<p style="color:#64748b;">No kitchen tickets under "${activeKdsFilter}".</p>`;
    return;
  }

  $("kdsBoard").innerHTML = list.map(o => `
    <div class="kds-card ${o.status}">
      <div>
        <div class="kds-head">
          <strong>${o.id} • ${o.table}</strong>
          <span class="status-tag ${o.status}">${o.status}</span>
        </div>
        <small style="color:#64748b;">${o.customer} • ${o.createdAt} • ${o.payMethod}</small>
        <ul class="kds-items">
          ${o.items.map(i => `<li><strong>${i.qty}x</strong> ${i.name}</li>`).join("")}
        </ul>
        ${o.note ? `<div class="kds-note">Note: ${o.note}</div>` : ""}
      </div>
      <div class="kds-actions">
        ${o.status !== "Completed"
          ? `<button onclick="advanceKdsStatus('${o.id}')">Advance Stage &rarr;</button>`
          : `<button disabled>Archived</button>`}
      </div>
    </div>
  `).join("");
}

$("simulateRushBtn").addEventListener("click", () => {
  const available = catalog.filter(d => d.stock > 1);
  if (available.length < 2) return notify("Restock items first.");
  const pick1 = available[Math.floor(Math.random() * available.length)];
  const pick2 = available[Math.floor(Math.random() * available.length)];
  const tables = ["T-01", "T-02", "T-03", "T-04", "T-05"];
  const items = [{ id: pick1.id, name: pick1.name, category: pick1.category, price: pick1.price, cost: pick1.cost, qty: 1 }];
  if (pick2.id !== pick1.id) {
    items.push({ id: pick2.id, name: pick2.name, category: pick2.category, price: pick2.price, cost: pick2.cost, qty: 1 });
  }
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const cost = items.reduce((s, i) => s + i.cost, 0);
  const tax = Math.round(subtotal * 0.08);
  orders.unshift({
    id: "PP-" + Math.floor(1000 + Math.random() * 9000),
    table: tables[Math.floor(Math.random() * tables.length)],
    customer: "Demo Diner",
    note: "",
    items,
    subtotal,
    discount: 0,
    tax,
    total: subtotal + tax,
    cost,
    payMethod: "Card / QR",
    status: "Pending",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  syncStorage();
  renderKDS();
  renderTableStatus();
  notify("Simulated incoming table order!");
});

// ANALYTICS & BI DASHBOARD
function renderAnalytics() {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCost = orders.reduce((s, o) => s + (o.cost || 0), 0);
  const netProfit = Math.max(0, revenue - totalCost);
  const marginPct = revenue ? ((netProfit / revenue) * 100).toFixed(1) : 0;
  const aov = orders.length ? Math.round(revenue / orders.length) : 0;

  const dishSales = {};
  const catRevenue = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      dishSales[i.name] = (dishSales[i.name] || 0) + i.qty;
      catRevenue[i.category] = (catRevenue[i.category] || 0) + (i.price * i.qty);
    });
  });

  const topDish = Object.entries(dishSales).sort((a, b) => b[1] - a[1])[0];

  $("kpiRevenue").textContent = `PKR ${revenue.toLocaleString()}`;
  $("kpiOrdersCount").textContent = `${orders.length} order(s) processed`;
  $("kpiAov").textContent = `PKR ${aov.toLocaleString()}`;
  $("kpiMargin").textContent = `${marginPct}%`;
  $("kpiProfitVal").textContent = `Est. net PKR ${netProfit.toLocaleString()}`;
  $("kpiTopDish").textContent = topDish ? topDish[0] : "—";
  $("kpiTopQty").textContent = topDish ? `${topDish[1]} units sold` : "0 units sold";

  const maxCatVal = Math.max(...Object.values(catRevenue), 1);
  const allCats = ["Burgers", "Main Course", "Sides", "Drinks"];
  $("categoryChart").innerHTML = allCats.map(cat => {
    const val = catRevenue[cat] || 0;
    const pct = Math.round((val / maxCatVal) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label"><span>${cat}</span><strong>PKR ${val.toLocaleString()}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

// INVENTORY & MARGIN LEDGER
function restockItem(id, amount) {
  const dish = catalog.find(d => d.id === id);
  if (!dish) return;
  dish.stock += amount;
  syncStorage();
  renderInventory();
  renderMenuGrid();
}

function renderInventory() {
  $("inventoryTableBody").innerHTML = catalog.map(d => {
    const margin = Math.round(((d.price - d.cost) / d.price) * 100);
    return `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.category}</td>
        <td>PKR ${d.price} / <span style="color:#64748b;">${d.cost}</span></td>
        <td>${margin}%</td>
        <td class="${d.stock <= 5 ? "stock-low" : ""}">${d.stock}</td>
        <td><button class="outline-btn" onclick="restockItem(${d.id}, 10)">+10 Stock</button></td>
      </tr>
    `;
  }).join("");
}

$("newDishForm").addEventListener("submit", (e) => {
  e.preventDefault();
  catalog.push({
    id: Date.now(),
    name: $("fName").value.trim(),
    category: $("fCategory").value,
    prepMins: Number($("fPrep").value),
    cost: Number($("fCost").value),
    price: Number($("fPrice").value),
    stock: Number($("fStock").value),
    desc: $("fDesc").value.trim()
  });
  syncStorage();
  e.target.reset();
  renderCategories();
  renderMenuGrid();
  renderInventory();
  notify("New dish published to catalog.");
});

// NATURAL LANGUAGE AI ASSISTANTS
function pushChat(boxId, text, role) {
  const box = $(boxId);
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

$("customerChatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("customerChatInput").value.trim();
  if (!q) return;
  pushChat("customerChatLog", q, "user");
  $("customerChatInput").value = "";

  const lower = q.toLowerCase();
  const inStock = catalog.filter(d => d.stock > 0);
  const numMatch = lower.match(/(\d{2,5})/);

  let reply = "";
  if (numMatch) {
    const cap = Number(numMatch[1]);
    const hits = inStock.filter(d => d.price <= cap);
    reply = hits.length
      ? `Items within PKR ${cap}: ${hits.slice(0, 3).map(h => `${h.name} (PKR ${h.price})`).join(", ")}.`
      : `No single dish is under PKR ${cap}. Lowest item is ${[...inStock].sort((a,b)=>a.price-b.price)[0]?.name}.`;
  } else if (lower.includes("spicy") || lower.includes("peri") || lower.includes("zinger")) {
    const spicy = inStock.filter(d => /spicy|peri|zinger|jalapeno|masala/i.test(d.name + d.desc));
    reply = `Top spicy picks: ${spicy.map(s => `${s.name} (PKR ${s.price})`).join(", ")}.`;
  } else if (lower.includes("combo") || lower.includes("dinner") || lower.includes("lunch")) {
    const main = inStock.find(d => d.category === "Main Course" || d.category === "Burgers");
    const side = inStock.find(d => d.category === "Sides");
    const drink = inStock.find(d => d.category === "Drinks");
    reply = main && drink
      ? `Chef's Combo: ${main.name} + ${side ? side.name + " + " : ""}${drink.name} (Total: PKR ${main.price + (side?.price || 0) + drink.price}).`
      : "Try pairing any burger with Mint Margarita!";
  } else {
    reply = "Ask me with a budget (e.g. 'under 900'), 'spicy dishes', or 'suggest a dinner combo'.";
  }
  pushChat("customerChatLog", reply, "bot");
});

$("managerChatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("managerChatInput").value.trim();
  if (!q) return;
  pushChat("managerChatLog", q, "user");
  $("managerChatInput").value = "";

  const lower = q.toLowerCase();
  const rev = orders.reduce((s, o) => s + o.total, 0);
  const cost = orders.reduce((s, o) => s + (o.cost || 0), 0);
  const active = orders.filter(o => o.status !== "Completed").length;
  const lowStock = catalog.filter(d => d.stock <= 5);

  let reply = "";
  if (lower.includes("profit") || lower.includes("margin") || lower.includes("revenue")) {
    const profit = Math.max(0, rev - cost);
    const pct = rev ? ((profit / rev) * 100).toFixed(1) : 0;
    reply = `Gross Revenue: PKR ${rev.toLocaleString()} | Est. Net Profit: PKR ${profit.toLocaleString()} (${pct}% margin).`;
  } else if (lower.includes("bottleneck") || lower.includes("kitchen") || lower.includes("queue")) {
    reply = `Kitchen Load: ${active} active ticket(s) in queue. Average prep SLA is 12 mins.`;
  } else if (lower.includes("stock") || lower.includes("restock") || lower.includes("low")) {
    reply = lowStock.length
      ? `Low Stock Alert: ${lowStock.map(l => `${l.name} (${l.stock} left)`).join(", ")}.`
      : "All menu items have healthy stock levels (>5 portions).";
  } else {
    reply = `Executive Pulse: ${orders.length} orders, PKR ${rev.toLocaleString()} revenue, ${active} active kitchen tickets, ${lowStock.length} low-stock alerts.`;
  }
  pushChat("managerChatLog", reply, "bot");
});

// CSV EXPORT
$("exportReportBtn").addEventListener("click", () => {
  const rows = [
    ["Order_ID", "Table", "Customer", "Payment", "Status", "Subtotal", "Tax", "Total_PKR", "Time"],
    ...orders.map(o => [o.id, o.table, o.customer, o.payMethod, o.status, o.subtotal, o.tax, o.total, o.createdAt])
  ];
  const csv = rows.map(r => r.join(",")).join("
");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "pop-paradise-sales-report.csv";
  a.click();
});

// INIT
renderCategories();
renderMenuGrid();
renderCart();
renderTableStatus();
