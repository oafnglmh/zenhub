'use strict';

// ==================== UTILITIES ====================

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatTime = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const formatDateTime = (ts) =>
  new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDateShort = (ts) =>
  new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

const formatDuration = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
};

/** Render a Lucide icon tag. After injecting, call lucide.createIcons() */
const ic = (name, size = 16) =>
  `<i data-lucide="${name}" style="width:${size}px;height:${size}px;flex-shrink:0"></i>`;

// ==================== TOAST ====================

const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const iconMap = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    el.innerHTML = `${ic(iconMap[type] || 'info', 18)}<span>${message}</span>`;
    container.appendChild(el);
    lucide.createIcons({ nodes: [el] });
    setTimeout(() => {
      el.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
};

// ==================== MODAL ====================

const Modal = {
  _overlay: null,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
  },

  show(html) {
    this._overlay.innerHTML = html;
    this._overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this._overlay.classList.add('visible'));
    });
    lucide.createIcons({ nodes: [this._overlay] });
  },

  close() {
    App.checkoutTableId = null; // clear checkout state
    this._overlay.classList.remove('visible');
    setTimeout(() => {
      this._overlay.classList.add('hidden');
      this._overlay.innerHTML = '';
    }, 300);
  },
};

// ==================== MAIN APP ====================

const App = {
  currentPage: 'dashboard',
  _timerInterval: null,
  _dashChart: null,
  _revenueChart: null,
  currentFoodTableId: null,
  currentFoodCategory: 'Tất cả',
  currentRevenueFilter: 'month',
  checkoutTableId: null,

  // ────────────────────────────── INIT ──────────────────────────────

  init() {
    Store.init();
    Modal.init();
    this._setupNav();
    this.navigate('dashboard');
    this._startTimers();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Modal.close(); });
  },

  _setupNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(el.dataset.page);
      });
    });
  },

  navigate(page) {
    this.currentPage = page;

    document.querySelectorAll('.nav-item[data-page]').forEach(el =>
      el.classList.toggle('active', el.dataset.page === page));

    document.querySelectorAll('.page').forEach(el =>
      el.classList.toggle('active', el.id === `page-${page}`));

    const renderers = {
      dashboard:  () => this.renderDashboard(),
      tables:     () => this.renderTables(),
      revenue:    () => this.renderRevenue(),
      menu:       () => this.renderMenuPage(),
      cafebill:   () => this.renderCafeBill(),
      settings:   () => this.renderSettings(),
    };
    if (renderers[page]) renderers[page]();
  },

  // ────────────────────────────── TIMERS ──────────────────────────────

  _startTimers() {
    this._timerInterval = setInterval(() => this._tick(), 1000);
  },

  _tick() {
    const sessions = Store.getSessions();
    const tables   = Store.getTables();

    Object.entries(sessions).forEach(([tableId, session]) => {
      if (session.isPaused) return;
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const elapsed   = Store.getElapsedSeconds(session);
      const tableBill = Store.calcTableBill(session, table.pricePerHour);
      const foodBill  = Store.calcFoodBill(session.items);
      const total     = tableBill + foodBill;

      const timerEl = document.querySelector(`[data-timer="${tableId}"]`);
      const billEl  = document.querySelector(`[data-bill="${tableId}"]`);
      if (timerEl) timerEl.textContent = formatTime(elapsed);
      if (billEl)  billEl.textContent  = formatMoney(total);
    });

    // Live checkout update
    if (this.checkoutTableId) {
      const session = Store.getSession(this.checkoutTableId);
      const table   = Store.getTable(this.checkoutTableId);
      if (session && table) {
        const elapsed   = Store.getElapsedSeconds(session);
        const tableBill = Store.calcTableBill(session, table.pricePerHour);
        const foodBill  = Store.calcFoodBill(session.items);
        const pct       = parseFloat(document.getElementById('discount-pct')?.value) || 0;
        const subtotal  = tableBill + foodBill;
        const discount  = Math.round(subtotal * pct / 100);
        const total     = subtotal - discount;

        const timeEl  = document.getElementById('checkout-time');
        const totalEl = document.getElementById('checkout-total');
        const tblEl   = document.getElementById('checkout-table-bill');

        if (timeEl)  timeEl.textContent  = formatTime(elapsed);
        if (tblEl)   tblEl.textContent   = formatMoney(tableBill);
        if (totalEl) totalEl.textContent = formatMoney(total);
      }
    }

    // Dashboard live active list
    if (this.currentPage === 'dashboard') this._updateDashboardActive();
  },

  // ────────────────────────────── DASHBOARD ──────────────────────────────

  renderDashboard() {
    const invoices = Store.getInvoices();
    const sessions = Store.getSessions();
    const tables   = Store.getTables();
    const now      = new Date();

    const dayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const todayInvoices = invoices.filter(i => i.createdAt >= dayStart);
    const todayRevenue  = todayInvoices.reduce((s, i) => s + i.total, 0);
    const monthRevenue  = invoices.filter(i => i.createdAt >= monthStart).reduce((s, i) => s + i.total, 0);
    const activeTables  = Object.keys(sessions).length;

    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    s('stat-today',    formatMoney(todayRevenue));
    s('stat-month',    formatMoney(monthRevenue));
    s('stat-active',   `${activeTables}/${tables.length}`);
    s('stat-invoices', todayInvoices.length);

    this._updateDashboardActive();
    this._renderDashChart();
  },

  _updateDashboardActive() {
    const container = document.getElementById('active-tables-list');
    if (!container) return;
    const sessions = Store.getSessions();
    const tables   = Store.getTables();
    const entries  = Object.entries(sessions);

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:28px 0">
          ${ic('coffee', 36)}
          <p style="margin-top:10px">Chưa có bàn nào đang chơi</p>
        </div>`;
      lucide.createIcons({ nodes: [container] });
      return;
    }

    container.innerHTML = entries.map(([tableId, session]) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return '';
      const elapsed = Store.getElapsedSeconds(session);
      const bill    = Store.calcTableBill(session, table.pricePerHour) + Store.calcFoodBill(session.items);
      const paused  = session.isPaused;
      const match   = table.name.match(/\d+/);
      const ballNum = match ? (parseInt(match[0], 10) - 1) % 15 + 1 : 8;
      return `
        <div class="active-table-item">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="pool-ball ball-${ballNum}" style="width:28px; height:28px;" title="Bóng số ${ballNum}">
              <span style="width:14px; height:14px; font-size:9.5px;">${ballNum}</span>
            </div>
            <div>
              <div class="active-table-name">${table.name}</div>
              <div class="active-table-status ${paused ? 'paused' : 'active'}">
                ${paused ? ic('pause', 10) + ' Tạm dừng' : ic('play', 10) + ' Đang chơi'}
              </div>
            </div>
          </div>
          <div style="text-align:right">
            <div class="active-table-timer ${paused ? 'paused' : ''}" data-timer="${tableId}">${formatTime(elapsed)}</div>
            <div class="active-table-bill" data-bill="${tableId}">${formatMoney(bill)}</div>
          </div>
        </div>`;
    }).join('');
    lucide.createIcons({ nodes: [container] });
  },

  _renderDashChart() {
    const canvas = document.getElementById('revenue-chart-dash');
    if (!canvas) return;
    const invoices = Store.getInvoices();
    const labels = [], data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const nd = new Date(d); nd.setDate(d.getDate() + 1);
      labels.push(formatDateShort(d.getTime()));
      data.push(invoices.filter(inv => inv.createdAt >= d.getTime() && inv.createdAt < nd.getTime())
        .reduce((s, inv) => s + inv.total, 0));
    }
    if (this._dashChart) this._dashChart.destroy();
    this._dashChart = new Chart(canvas, this._chartConfig(labels, data));
  },

  _chartConfig(labels, data, type = 'bar') {
    return {
      type,
      data: {
        labels,
        datasets: [{
          label: 'Doanh thu',
          data,
          backgroundColor: data.map(v => v > 0 ? 'rgba(37,99,235,0.7)' : 'rgba(148,163,184,0.2)'),
          borderColor: data.map(v => v > 0 ? '#2563eb' : '#cbd5e1'),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => formatMoney(ctx.raw) } },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#64748b', font: { family: 'Inter', weight: '600', size: 11 }, maxRotation: 45 },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', weight: '600', size: 11 },
              callback: (v) => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3)+'k' : v,
            },
          },
        },
      },
    };
  },

  // ────────────────────────────── TABLES ──────────────────────────────

  renderTables() {
    const tables   = Store.getTables();
    const sessions = Store.getSessions();
    const grid     = document.getElementById('tables-grid');
    if (!grid) return;

    // Update nav badge
    const badge = document.getElementById('active-tables-badge');
    const cnt   = Object.keys(sessions).length;
    if (badge) {
      badge.textContent = cnt > 0 ? cnt : '';
      badge.style.display = cnt > 0 ? '' : 'none';
    }

    if (tables.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          ${ic('table-2', 52)}
          <p style="margin-top:12px">Chưa có bàn nào. Nhấn <strong>Thêm bàn</strong> để bắt đầu!</p>
        </div>`;
      lucide.createIcons({ nodes: [grid] });
      return;
    }

    grid.innerHTML = tables.map(t => this._tableCardHTML(t, sessions[t.id])).join('');
    lucide.createIcons({ nodes: [grid] });
  },

  _tableCardHTML(table, session) {
    const isActive = !!session && !session.isPaused;
    const isPaused = !!session && session.isPaused;
    const isIdle   = !session;
    const status   = isActive ? 'active' : isPaused ? 'paused' : 'idle';

    const elapsed   = session ? Store.getElapsedSeconds(session) : 0;
    const tableBill = session ? Store.calcTableBill(session, table.pricePerHour) : 0;
    const foodBill  = session ? Store.calcFoodBill(session.items) : 0;
    const total     = tableBill + foodBill;
    const foodCnt   = session ? session.items.reduce((s, i) => s + i.quantity, 0) : 0;

    const statusLabel = { active: 'Đang chơi', paused: 'Tạm dừng', idle: 'Trống' }[status];
    const statusIcon  = { active: 'play', paused: 'pause', idle: 'circle' }[status];

    // Extract table number for 3D pool ball styling
    const tableNumMatch = table.name.match(/\d+/);
    const ballNum = tableNumMatch ? (parseInt(tableNumMatch[0], 10) - 1) % 15 + 1 : 8;

    return `
      <div class="table-card pool-table status-${status}" id="card-${table.id}">
        <!-- Pool Table Wooden Rail Top -->
        <div class="pool-rail pool-rail-top">
          <span class="rail-diamond"></span>
          <span class="rail-diamond"></span>
          <span class="rail-diamond"></span>
        </div>

        <!-- 6 Pockets -->
        <div class="pocket pocket-tl"></div>
        <div class="pocket pocket-tc"></div>
        <div class="pocket pocket-tr"></div>
        <div class="pocket pocket-bl"></div>
        <div class="pocket pocket-bc"></div>
        <div class="pocket pocket-br"></div>

        <!-- Felt Playing Surface -->
        <div class="pool-felt">
          <div class="felt-light-spot"></div>

          <div class="table-card-header">
            <div class="table-info">
              <div class="table-name-row">
                <div class="pool-ball ball-${ballNum}" title="Bóng số ${ballNum}">
                  <span>${ballNum}</span>
                </div>
                <div class="table-title-group">
                  <span class="table-name">${table.name}</span>
                  <span class="status-badge ${status}">
                    ${ic(statusIcon, 10)} ${statusLabel}
                  </span>
                </div>
              </div>
            </div>
            <div class="table-meta">
              <div class="table-rate">${ic('clock', 12)} ${formatMoney(table.pricePerHour)}/h</div>
              ${foodCnt > 0 ? `<div class="food-badge">${ic('utensils', 12)} ${foodCnt} món</div>` : ''}
            </div>
          </div>

          <div class="table-card-body">
            <div class="scoreboard-timer-box ${status}">
              <div class="timer-label">THỜI GIAN CHƠI</div>
              <div class="table-timer ${status}" data-timer="${table.id}">${formatTime(elapsed)}</div>
            </div>

            ${isIdle
              ? `<div class="table-bill idle"><span class="cue-ball-dot"></span> Bàn trống — Sẵn sàng mở bàn</div>`
              : `<div class="scoreboard-bill-box">
                   <div class="bill-title">TỔNG CẦN THANH TOÁN</div>
                   <div class="table-bill" data-bill="${table.id}">${formatMoney(total)}</div>
                   <div class="table-bill-breakdown">
                     <span>${ic('circle-dot', 11)} Bida: <strong>${formatMoney(tableBill)}</strong></span>
                     <span>${ic('utensils', 11)} Dịch vụ: <strong>${formatMoney(foodBill)}</strong></span>
                   </div>
                 </div>`
            }
          </div>
        </div>

        <!-- Pool Table Wooden Rail Bottom -->
        <div class="pool-rail pool-rail-bottom">
          <span class="rail-diamond"></span>
          <span class="rail-diamond"></span>
          <span class="rail-diamond"></span>
        </div>

        <div class="table-card-actions">
          ${isIdle ? `
            <button class="btn btn-success" onclick="App.openTableModal('${table.id}')">
              ${ic('play')} Mở bàn
            </button>
            <button class="btn btn-ghost btn-icon" onclick="App.editTableModal('${table.id}')" title="Chỉnh sửa">
              ${ic('pencil')}
            </button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteTable('${table.id}')" title="Xóa bàn">
              ${ic('trash-2')}
            </button>
          ` : ''}
          ${isActive ? `
            <button class="btn btn-warning" onclick="App.pauseTable('${table.id}')">
              ${ic('pause')} Tạm dừng
            </button>
            <button class="btn btn-secondary" onclick="App.openFoodModal('${table.id}')">
              ${ic('utensils')} Gọi món
            </button>
            <button class="btn btn-danger" onclick="App.openCheckout('${table.id}')">
              ${ic('receipt')} Đóng bàn
            </button>
          ` : ''}
          ${isPaused ? `
            <button class="btn btn-success" onclick="App.resumeTable('${table.id}')">
              ${ic('play')} Tiếp tục
            </button>
            <button class="btn btn-secondary" onclick="App.openFoodModal('${table.id}')">
              ${ic('utensils')} Gọi món
            </button>
            <button class="btn btn-danger" onclick="App.openCheckout('${table.id}')">
              ${ic('receipt')} Đóng bàn
            </button>
          ` : ''}
        </div>
      </div>`;
  },

  // ── Table CRUD ──

  openTableModal(tableId) {
    const table = Store.getTable(tableId);
    const def   = Store.getSettings().defaultPricePerHour;
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('play', 20)} Mở bàn — ${table.name}</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-group">
          <label class="form-label">Giá tiền / giờ (VNĐ)</label>
          <input type="number" id="modal-open-price" class="form-control"
            value="${table.pricePerHour}" min="0" step="5000">
          <div class="form-hint">Mặc định: ${formatMoney(def)}/giờ — có thể thay đổi mỗi lần mở</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-success btn-lg" onclick="App.confirmOpenTable('${tableId}')">
            ${ic('play')} Bắt đầu chơi
          </button>
        </div>
      </div>`);
  },

  confirmOpenTable(tableId) {
    const price = parseInt(document.getElementById('modal-open-price')?.value) || Store.getSettings().defaultPricePerHour;
    Store.updateTable(tableId, { pricePerHour: price });
    Store.startSession(tableId);
    Modal.close();
    Toast.show('Đã mở bàn! Chúc vui vẻ 🎱', 'success');
    this.renderTables();
  },

  pauseTable(tableId) {
    Store.pauseSession(tableId);
    Toast.show('Đã tạm dừng bàn', 'warning');
    this.renderTables();
  },

  resumeTable(tableId) {
    Store.resumeSession(tableId);
    Toast.show('Đã tiếp tục chơi!', 'success');
    this.renderTables();
  },

  editTableModal(tableId) {
    const t = Store.getTable(tableId);
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('pencil', 20)} Chỉnh sửa bàn</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-group">
          <label class="form-label">Tên bàn</label>
          <input type="text" id="et-name" class="form-control" value="${t.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Loại bàn</label>
            <select id="et-type" class="form-control">
              <option value="standard" ${t.type === 'standard' ? 'selected' : ''}>Bàn thường</option>
              <option value="vip"      ${t.type === 'vip'      ? 'selected' : ''}>Bàn VIP</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Giá mặc định / giờ</label>
            <input type="number" id="et-price" class="form-control" value="${t.pricePerHour}" min="0" step="5000">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-primary" onclick="App.saveTableEdit('${tableId}')">
            ${ic('save')} Lưu thay đổi
          </button>
        </div>
      </div>`);
  },

  saveTableEdit(tableId) {
    const name  = document.getElementById('et-name').value.trim();
    const type  = document.getElementById('et-type').value;
    const price = parseInt(document.getElementById('et-price').value) || 50000;
    if (!name) { Toast.show('Vui lòng nhập tên bàn!', 'error'); return; }
    Store.updateTable(tableId, { name, type, pricePerHour: price });
    Modal.close();
    Toast.show('Đã cập nhật bàn!', 'success');
    this.renderTables();
  },

  addTableModal() {
    const def = Store.getSettings().defaultPricePerHour;
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('plus', 20)} Thêm bàn mới</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-group">
          <label class="form-label">Tên bàn</label>
          <input type="text" id="nt-name" class="form-control" placeholder="Bàn 5, Bàn VIP 1…">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Loại bàn</label>
            <select id="nt-type" class="form-control">
              <option value="standard">Bàn thường</option>
              <option value="vip">Bàn VIP</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Giá / giờ (VNĐ)</label>
            <input type="number" id="nt-price" class="form-control" value="${def}" min="0" step="5000">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-primary" onclick="App.saveNewTable()">
            ${ic('plus')} Thêm bàn
          </button>
        </div>
      </div>`);
  },

  saveNewTable() {
    const name  = document.getElementById('nt-name').value.trim();
    const type  = document.getElementById('nt-type').value;
    const price = parseInt(document.getElementById('nt-price').value) || 50000;
    if (!name) { Toast.show('Vui lòng nhập tên bàn!', 'error'); return; }
    Store.addTable({ name, type, pricePerHour: price });
    Modal.close();
    Toast.show(`Đã thêm ${name}!`, 'success');
    this.renderTables();
  },

  deleteTable(tableId) {
    if (Store.getSession(tableId)) {
      Toast.show('Không thể xóa bàn đang hoạt động!', 'error'); return;
    }
    const t = Store.getTable(tableId);
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" style="color:var(--danger)">${ic('trash-2', 20)} Xóa bàn</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:24px">
          Bạn có chắc muốn xóa <strong style="color:var(--text-primary)">${t.name}</strong>?<br>
          Hành động này không thể hoàn tác.
        </p>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-danger" onclick="App._doDeleteTable('${tableId}')">
            ${ic('trash-2')} Xóa bàn
          </button>
        </div>
      </div>`);
  },

  _doDeleteTable(tableId) {
    Store.deleteTable(tableId);
    Modal.close();
    Toast.show('Đã xóa bàn!', 'info');
    this.renderTables();
  },

  // ────────────────────────────── FOOD ORDERS ──────────────────────────────

  openFoodModal(tableId) {
    this.currentFoodTableId  = tableId;
    this.currentFoodCategory = 'Tất cả';
    this._drawFoodModal();
  },

  _drawFoodModal() {
    const tableId  = this.currentFoodTableId;
    const table    = Store.getTable(tableId);
    const session  = Store.getSession(tableId);
    const menu     = Store.getMenu();
    const cats     = ['Tất cả', ...new Set(menu.map(m => m.category))];
    const foodTotal = session ? Store.calcFoodBill(session.items) : 0;

    Modal.show(`
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">${ic('utensils', 20)} Gọi món — ${table.name}</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="food-modal-layout">
          <!-- LEFT: Menu -->
          <div class="food-left">
            <div class="food-category-tabs" id="food-cat-tabs">
              ${cats.map(c => `
                <button class="food-cat-tab ${c === this.currentFoodCategory ? 'active' : ''}"
                  onclick="App.setFoodCategory('${c}')" data-cat="${c}">${c}</button>`).join('')}
            </div>
            <div class="food-items-list" id="food-items-list">
              ${this._menuItemsHTML(menu, this.currentFoodCategory)}
            </div>
          </div>
          <!-- RIGHT: Order -->
          <div class="food-right">
            <div class="order-summary-title">
              ${ic('receipt', 16)} Đơn hàng hiện tại
            </div>
            <div id="order-items-list" class="order-items-list">
              ${this._orderItemsHTML(session)}
            </div>
            ${session && session.items.length > 0 ? `
              <div class="order-total-row">
                <span>Tổng đồ ăn/uống</span>
                <span id="food-total-display">${formatMoney(foodTotal)}</span>
              </div>` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Đóng</button>
          <button class="btn btn-primary" onclick="Modal.close()">
            ${ic('check')} Xác nhận
          </button>
        </div>
      </div>`);
  },

  _menuItemsHTML(menu, category) {
    const filtered = category === 'Tất cả' ? menu : menu.filter(m => m.category === category);
    if (!filtered.length) return `<div class="order-empty">${ic('package', 28)}<p>Không có món nào</p></div>`;
    return filtered.map(item => {
      const thumb = item.image
        ? `<img class="food-img" src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<div class=food-emoji-fallback>${item.emoji}</div>'">`
        : `<div class="food-emoji-fallback">${item.emoji}</div>`;
      return `
        <div class="food-menu-item">
          <div class="food-item-info">
            ${thumb}
            <div>
              <div class="food-item-name">${item.name}</div>
              <div class="food-item-price">${formatMoney(item.price)}</div>
            </div>
          </div>
          <button class="food-item-add" onclick="App.addFoodToSession('${item.id}')">
            ${ic('plus', 14)}
          </button>
        </div>`;
    }).join('');
  },

  _orderItemsHTML(session) {
    if (!session || session.items.length === 0) {
      return `<div class="order-empty">${ic('shopping-cart', 32)}<p>Chưa gọi món nào</p></div>`;
    }
    return session.items.map(item => `
      <div class="order-item">
        <div class="order-item-name">${item.emoji} ${item.name}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="App.changeItemQty('${item.menuItemId}', -1)">${ic('minus', 12)}</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="App.changeItemQty('${item.menuItemId}', 1)">${ic('plus', 12)}</button>
        </div>
        <div class="order-item-total">${formatMoney(item.price * item.quantity)}</div>
      </div>`).join('');
  },

  setFoodCategory(category) {
    this.currentFoodCategory = category;
    document.querySelectorAll('#food-cat-tabs .food-cat-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === category);
    });
    const listEl = document.getElementById('food-items-list');
    if (listEl) {
      listEl.innerHTML = this._menuItemsHTML(Store.getMenu(), category);
      lucide.createIcons({ nodes: [listEl] });
    }
  },

  addFoodToSession(menuItemId) {
    const tableId  = this.currentFoodTableId;
    const menuItem = Store.getMenu().find(m => m.id === menuItemId);
    if (!menuItem || !tableId) return;
    Store.addItemToSession(tableId, {
      menuItemId: menuItem.id,
      name:       menuItem.name,
      price:      menuItem.price,
      emoji:      menuItem.emoji,
    });
    this._refreshOrderPanel();
    Toast.show(`Đã thêm ${menuItem.name}!`, 'success', 1500);
  },

  changeItemQty(menuItemId, delta) {
    const tableId = this.currentFoodTableId;
    const session = Store.getSession(tableId);
    if (!session) return;
    const item = session.items.find(i => i.menuItemId === menuItemId);
    if (!item) return;
    Store.updateSessionItem(tableId, menuItemId, item.quantity + delta);
    this._refreshOrderPanel();
  },

  _refreshOrderPanel() {
    const tableId = this.currentFoodTableId;
    const session = Store.getSession(tableId);
    const listEl  = document.getElementById('order-items-list');
    if (!listEl) return;
    listEl.innerHTML = this._orderItemsHTML(session);
    lucide.createIcons({ nodes: [listEl] });

    const foodTotal = session ? Store.calcFoodBill(session.items) : 0;
    const totalEl   = document.getElementById('food-total-display');
    if (totalEl) totalEl.textContent = formatMoney(foodTotal);
  },

  // ────────────────────────────── CHECKOUT ──────────────────────────────

  openCheckout(tableId) {
    const table   = Store.getTable(tableId);
    const session = Store.getSession(tableId);
    if (!session) return;

    this.checkoutTableId = tableId;

    const elapsed   = Store.getElapsedSeconds(session);
    const tableBill = Store.calcTableBill(session, table.pricePerHour);
    const foodBill  = Store.calcFoodBill(session.items);
    const total     = tableBill + foodBill;

    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('receipt', 20)} Thanh toán — ${table.name}</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>

        <div class="checkout-section">
          <div class="checkout-section-title">${ic('clock', 14)} Thời gian chơi</div>
          <div class="checkout-row">
            <span>Thời lượng</span>
            <span class="value" id="checkout-time">${formatTime(elapsed)}</span>
          </div>
          <div class="checkout-row">
            <span>Đơn giá</span>
            <span class="value">${formatMoney(table.pricePerHour)}/giờ</span>
          </div>
          <div class="checkout-row" style="font-weight:800">
            <span>Tiền bàn bida</span>
            <span class="value" id="checkout-table-bill" style="color:var(--purple-light)">${formatMoney(tableBill)}</span>
          </div>
        </div>

        ${session.items.length > 0 ? `
          <div class="checkout-section">
            <div class="checkout-section-title">${ic('utensils', 14)} Đồ ăn & Thức uống</div>
            ${session.items.map(item => `
              <div class="checkout-row">
                <span>${item.emoji} ${item.name} × ${item.quantity}</span>
                <span class="value">${formatMoney(item.price * item.quantity)}</span>
              </div>`).join('')}
            <div class="checkout-row" style="font-weight:800;border-top:1px solid var(--border);margin-top:6px;padding-top:10px">
              <span>Tổng đồ ăn</span>
              <span class="value">${formatMoney(foodBill)}</span>
            </div>
          </div>` : ''}

        <div class="checkout-section">
          <div class="checkout-section-title">${ic('tag', 14)} Giảm giá (tuỳ chọn)</div>
          <div class="discount-row">
            <span class="discount-label">Giảm</span>
            <input type="number" id="discount-pct" class="form-control discount-input"
              value="0" min="0" max="100"
              oninput="App._updateCheckoutTotal(${tableBill}, ${foodBill})">
            <span class="discount-label">%</span>
            <span class="discount-amount" id="discount-amount">— 0đ</span>
          </div>
        </div>

        <div class="checkout-total-bar">
          <span>TỔNG CỘNG</span>
          <span id="checkout-total">${formatMoney(total)}</span>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-ghost" onclick="App.finalizePayment('${tableId}', false)">
            ${ic('check')} Thanh toán
          </button>
          <button class="btn btn-primary" onclick="App.finalizePayment('${tableId}', true)">
            ${ic('printer')} Thanh toán & In hóa đơn
          </button>
        </div>
      </div>`);
  },

  _updateCheckoutTotal(tableBill, foodBill) {
    const pct      = parseFloat(document.getElementById('discount-pct')?.value) || 0;
    const subtotal = tableBill + foodBill;
    const discount = Math.round(subtotal * pct / 100);
    const total    = subtotal - discount;

    const discEl  = document.getElementById('discount-amount');
    const totalEl = document.getElementById('checkout-total');
    if (discEl)  discEl.textContent  = `— ${formatMoney(discount)}`;
    if (totalEl) totalEl.textContent = formatMoney(total);
  },

  finalizePayment(tableId, shouldPrint) {
    const table   = Store.getTable(tableId);
    const session = Store.getSession(tableId);
    if (!session) return;

    const elapsed     = Store.getElapsedSeconds(session);
    const tableBill   = Store.calcTableBill(session, table.pricePerHour);
    const foodBill    = Store.calcFoodBill(session.items);
    const discountPct = parseFloat(document.getElementById('discount-pct')?.value) || 0;
    const subtotal    = tableBill + foodBill;
    const discount    = Math.round(subtotal * discountPct / 100);
    const total       = subtotal - discount;

    const invoice = Store.addInvoice({
      tableName:      table.name,
      tableId:        table.id,
      pricePerHour:   table.pricePerHour,
      startTime:      session.startTime,
      endTime:        Date.now(),
      elapsedSeconds: elapsed,
      tableBill,
      foodItems:      [...session.items],
      foodBill,
      discountPct,
      discount,
      subtotal,
      total,
    });

    Store.endSession(tableId);
    this.checkoutTableId = null;
    Modal.close();
    Toast.show(`Đã thanh toán ${formatMoney(total)}! 🎉`, 'success');
    this.renderTables();
    if (shouldPrint) setTimeout(() => this.printInvoice(invoice), 400);
  },

  // ────────────────────────────── PRINT / INVOICE ──────────────────────────────

  printInvoice(invoice) {
    const settings = Store.getSettings();
    const h = Math.floor(invoice.elapsedSeconds / 3600);
    const m = Math.floor((invoice.elapsedSeconds % 3600) / 60);
    const s = invoice.elapsedSeconds % 60;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = `
      <div class="invoice-header">
        <div class="invoice-logo">🎱</div>
        <div class="invoice-shop-name">${settings.shopName}</div>
        <div class="invoice-shop-info">${settings.shopAddress}</div>
        <div class="invoice-shop-info">Hotline: ${settings.shopPhone}</div>
        <div class="invoice-divider-dashed"></div>
        <div class="invoice-number">Hóa đơn #${invoice.id.replace('inv_', '')}</div>
        <div class="invoice-date-text">${formatDateTime(invoice.createdAt)}</div>
      </div>

      <div class="invoice-table-info">
        <div class="invoice-table-name">🎱 ${invoice.tableName}</div>
        <div class="invoice-time-detail">
          Bắt đầu: ${formatDateTime(invoice.startTime)}<br>
          Kết thúc: ${formatDateTime(invoice.endTime)}<br>
          Thời gian: ${h}h ${m}m ${s}s
        </div>
      </div>

      <div class="invoice-section-title">CHI TIẾT HÓA ĐƠN</div>
      <div class="invoice-item">
        <span class="item-name">Tiền bàn bida</span>
        <span class="item-detail">${h}h${m}m × ${formatMoney(invoice.pricePerHour)}/h</span>
        <span class="item-price">${formatMoney(invoice.tableBill)}</span>
      </div>

      ${invoice.foodItems.length > 0 ? `
        <div class="invoice-divider-solid"></div>
        ${invoice.foodItems.map(item => `
          <div class="invoice-item">
            <span class="item-name">${item.emoji} ${item.name}</span>
            <span class="item-detail">× ${item.quantity}</span>
            <span class="item-price">${formatMoney(item.price * item.quantity)}</span>
          </div>`).join('')}` : ''}

      <div class="invoice-divider-dashed"></div>

      <div class="invoice-subtotal-row"><span>Tiền bàn</span><span>${formatMoney(invoice.tableBill)}</span></div>
      ${invoice.foodBill > 0 ? `<div class="invoice-subtotal-row"><span>Đồ ăn & thức uống</span><span>${formatMoney(invoice.foodBill)}</span></div>` : ''}
      ${invoice.discount > 0 ? `<div class="invoice-subtotal-row" style="color:#ef4444"><span>Giảm giá (${invoice.discountPct}%)</span><span>- ${formatMoney(invoice.discount)}</span></div>` : ''}

      <div class="invoice-total-bar">
        <span>TỔNG CỘNG</span>
        <span>${formatMoney(invoice.total)}</span>
      </div>

      <div class="invoice-footer">
        <div class="invoice-thank-you">${settings.footerNote}</div>
        <div>In lúc: ${formatDateTime(Date.now())}</div>
      </div>`;

    window.print();
  },

  viewInvoice(invoiceId) {
    const inv = Store.getInvoices().find(i => i.id === invoiceId);
    if (!inv) return;
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('receipt', 20)} Chi tiết hóa đơn</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="checkout-section">
          <div class="checkout-section-title">${ic('table-2', 14)} Thông tin</div>
          <div class="checkout-row"><span>Bàn</span><span class="value">${inv.tableName}</span></div>
          <div class="checkout-row"><span>Bắt đầu</span><span class="value">${formatDateTime(inv.startTime)}</span></div>
          <div class="checkout-row"><span>Kết thúc</span><span class="value">${formatDateTime(inv.endTime)}</span></div>
          <div class="checkout-row"><span>Thời gian</span><span class="value">${formatTime(inv.elapsedSeconds)}</span></div>
          <div class="checkout-row"><span>Tiền bàn</span><span class="value" style="color:var(--purple-light)">${formatMoney(inv.tableBill)}</span></div>
        </div>
        ${inv.foodItems.length > 0 ? `
          <div class="checkout-section">
            <div class="checkout-section-title">${ic('utensils', 14)} Đồ ăn & Thức uống</div>
            ${inv.foodItems.map(item => `
              <div class="checkout-row">
                <span>${item.emoji} ${item.name} × ${item.quantity}</span>
                <span class="value">${formatMoney(item.price * item.quantity)}</span>
              </div>`).join('')}
          </div>` : ''}
        <div class="checkout-section">
          <div class="checkout-row"><span>Tạm tính</span><span class="value">${formatMoney(inv.subtotal)}</span></div>
          ${inv.discount > 0 ? `<div class="checkout-row" style="color:var(--danger)"><span>Giảm (${inv.discountPct}%)</span><span>- ${formatMoney(inv.discount)}</span></div>` : ''}
          <div class="checkout-row total"><span>Tổng cộng</span><span class="value">${formatMoney(inv.total)}</span></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Đóng</button>
          <button class="btn btn-primary" onclick="App.printInvoice(Store.getInvoices().find(i=>i.id==='${inv.id}'));Modal.close()">
            ${ic('printer')} In hóa đơn
          </button>
        </div>
      </div>`);
  },

  deleteInvoice(invoiceId) {
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" style="color:var(--danger)">${ic('trash-2', 20)} Xóa hóa đơn</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:24px">Bạn có chắc muốn xóa hóa đơn này? Không thể hoàn tác.</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-danger" onclick="App._doDeleteInvoice('${invoiceId}')">
            ${ic('trash-2')} Xóa hóa đơn
          </button>
        </div>
      </div>`);
  },

  _doDeleteInvoice(id) {
    Store.deleteInvoice(id);
    Modal.close();
    Toast.show('Đã xóa hóa đơn!', 'info');
    this.renderRevenue();
  },

  // ────────────────────────────── REVENUE ──────────────────────────────

  renderRevenue() {
    const invoices = Store.getInvoices();
    const filter   = this.currentRevenueFilter;
    const now      = new Date();
    let startTime = 0, labels = [], data = [];

    if (filter === 'day') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTime   = today.getTime();
      labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
      data   = labels.map((_, i) => {
        const s = new Date(today.getFullYear(), today.getMonth(), today.getDate(), i).getTime();
        return invoices.filter(inv => inv.createdAt >= s && inv.createdAt < s + 3600000)
          .reduce((sum, inv) => sum + inv.total, 0);
      });
    } else if (filter === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d  = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const nd = new Date(d); nd.setDate(d.getDate() + 1);
        labels.push(formatDateShort(d.getTime()));
        data.push(invoices.filter(inv => inv.createdAt >= d.getTime() && inv.createdAt < nd.getTime())
          .reduce((s, inv) => s + inv.total, 0));
      }
      const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0);
      startTime = d.getTime();
    } else if (filter === 'month') {
      const ms   = new Date(now.getFullYear(), now.getMonth(), 1);
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      startTime  = ms.getTime();
      labels = Array.from({ length: days }, (_, i) => `${i+1}/${now.getMonth()+1}`);
      data   = labels.map((_, i) => {
        const d  = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const nd = new Date(now.getFullYear(), now.getMonth(), i + 2);
        return invoices.filter(inv => inv.createdAt >= d.getTime() && inv.createdAt < nd.getTime())
          .reduce((s, inv) => s + inv.total, 0);
      });
    } else if (filter === 'custom') {
      const fromVal = document.getElementById('date-from')?.value;
      const toVal   = document.getElementById('date-to')?.value;
      const fromD   = fromVal ? new Date(fromVal) : new Date(now.getFullYear(), now.getMonth(), 1);
      const toD     = toVal   ? new Date(toVal)   : now;
      toD.setHours(23,59,59,999);
      startTime = fromD.getTime();
      // Build per-day labels for custom range
      const msPerDay = 86400000;
      const diffDays = Math.min(Math.ceil((toD - fromD) / msPerDay), 92); // max 92 days
      for (let i = 0; i < diffDays; i++) {
        const d  = new Date(fromD.getTime() + i * msPerDay);
        const nd = new Date(d.getTime() + msPerDay);
        labels.push(formatDateShort(d.getTime()));
        data.push(invoices.filter(inv => inv.createdAt >= d.getTime() && inv.createdAt < Math.min(nd.getTime(), toD.getTime()))
          .reduce((s, inv) => s + inv.total, 0));
      }
    }

    const filtered     = filter === 'custom'
      ? (() => {
          const fromVal = document.getElementById('date-from')?.value;
          const toVal   = document.getElementById('date-to')?.value;
          const fromD   = fromVal ? new Date(fromVal) : new Date(now.getFullYear(), now.getMonth(), 1);
          const toD     = toVal ? new Date(toVal) : now; toD.setHours(23,59,59,999);
          return invoices.filter(inv => inv.createdAt >= fromD.getTime() && inv.createdAt <= toD.getTime());
        })()
      : invoices.filter(inv => inv.createdAt >= startTime);

    const totalRevenue = filtered.reduce((s, i) => s + i.total, 0);
    const avgInvoice   = filtered.length ? totalRevenue / filtered.length : 0;
    const tableBillSum = filtered.reduce((s, i) => s + (i.tableBill || 0), 0);
    const foodBillSum  = filtered.reduce((s, i) => s + (i.foodBill  || 0), 0);

    const st = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    st('rev-total',  formatMoney(totalRevenue));
    st('rev-count',  filtered.length);
    st('rev-avg',    formatMoney(avgInvoice));
    st('rev-table',  formatMoney(tableBillSum));
    st('rev-food',   formatMoney(foodBillSum));

    // Show/hide date range inputs
    const drWrap = document.getElementById('date-range-wrap');
    if (drWrap) drWrap.classList.toggle('show', filter === 'custom');

    const canvas = document.getElementById('revenue-chart-main');
    if (canvas) {
      if (this._revenueChart) this._revenueChart.destroy();
      this._revenueChart = new Chart(canvas, this._chartConfig(labels, data));
    }

    this._renderInvoiceTable(filtered);
  },

  setRevenueFilter(filter) {
    this.currentRevenueFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderRevenue();
  },

  _renderInvoiceTable(invoices) {
    const tbody = document.getElementById('invoice-tbody');
    if (!tbody) return;
    if (!invoices.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="td-empty">Chưa có hóa đơn nào trong kỳ này</td></tr>`;
      return;
    }
    tbody.innerHTML = invoices.slice(0, 100).map(inv => `
      <tr>
        <td><span class="inv-id">#${inv.id.replace('inv_','').slice(-6)}</span></td>
        <td style="font-weight:700;color:var(--text-primary)">${inv.tableName}</td>
        <td>${formatDateTime(inv.createdAt)}</td>
        <td style="font-family:monospace">${formatTime(inv.elapsedSeconds)}</td>
        <td style="font-weight:800;color:var(--purple-light)">${formatMoney(inv.total)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="App.viewInvoice('${inv.id}')" title="Xem">${ic('eye')}</button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="App.printInvoice(Store.getInvoices().find(i=>i.id==='${inv.id}'))" title="In">${ic('printer')}</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="App.deleteInvoice('${inv.id}')" title="Xóa">${ic('trash-2')}</button>
          </div>
        </td>
      </tr>`).join('');
    lucide.createIcons({ nodes: [tbody] });
  },

  // ────────────────────────────── MENU PAGE ──────────────────────────────

  renderMenuPage() {
    const menu  = Store.getMenu();
    const cats  = ['Tất cả', ...new Set(menu.map(m => m.category))];
    const fEl   = document.getElementById('menu-cat-filters');
    if (fEl) {
      fEl.innerHTML = cats.map(c => `
        <button class="food-cat-tab ${c === 'Tất cả' ? 'active' : ''}"
          onclick="App._filterMenuPage('${c}')" data-cat="${c}">${c}</button>`).join('');
    }
    this._renderMenuGrid('Tất cả');
  },

  _filterMenuPage(cat) {
    document.querySelectorAll('#menu-cat-filters .food-cat-tab').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.cat === cat));
    this._renderMenuGrid(cat);
  },

  _renderMenuGrid(cat) {
    const menu     = Store.getMenu();
    const filtered = cat === 'Tất cả' ? menu : menu.filter(m => m.category === cat);
    const grid     = document.getElementById('menu-grid');
    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${ic('package',48)}<p>Không có món nào</p></div>`;
      lucide.createIcons({ nodes: [grid] });
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const imgHtml = item.image
        ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=menu-card-img-fallback>${item.emoji}</div>'">`
        : `<div class="menu-card-img-fallback">${item.emoji}</div>`;
      return `
        <div class="menu-card">
          <div class="menu-card-img-wrap">${imgHtml}</div>
          <div class="menu-card-body">
            <div class="menu-card-info">
              <div class="menu-card-name">${item.name}</div>
              <div class="menu-card-cat">${item.category}</div>
              <div class="menu-card-price">${formatMoney(item.price)}</div>
            </div>
            <div class="menu-card-actions">
              <button class="btn btn-ghost btn-icon btn-sm" onclick="App.editMenuItemModal('${item.id}')" title="Sửa">
                ${ic('pencil')}
              </button>
              <button class="btn btn-danger btn-icon btn-sm" onclick="App.deleteMenuItem('${item.id}')" title="Xóa">
                ${ic('trash-2')}
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
    lucide.createIcons({ nodes: [grid] });
  },

  addMenuItemModal() {
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('plus',20)} Thêm món mới</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Emoji icon</label>
            <input type="text" id="ni-emoji" class="form-control" value="🍽️" maxlength="4">
          </div>
          <div class="form-group">
            <label class="form-label">Danh mục</label>
            <select id="ni-cat" class="form-control">
              <option>Thức uống</option>
              <option>Đồ ăn nhẹ</option>
              <option>Khác</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên món</label>
          <input type="text" id="ni-name" class="form-control" placeholder="Tên món ăn / đồ uống…">
        </div>
        <div class="form-group">
          <label class="form-label">Giá bán (VNĐ)</label>
          <input type="number" id="ni-price" class="form-control" value="25000" min="0" step="1000">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-primary" onclick="App._saveNewMenuItem()">
            ${ic('plus')} Thêm món
          </button>
        </div>
      </div>`);
  },

  _saveNewMenuItem() {
    const name  = document.getElementById('ni-name').value.trim();
    const emoji = document.getElementById('ni-emoji').value.trim() || '🍽️';
    const cat   = document.getElementById('ni-cat').value;
    const price = parseInt(document.getElementById('ni-price').value) || 0;
    if (!name) { Toast.show('Vui lòng nhập tên món!', 'error'); return; }
    Store.addMenuItem({ name, emoji, category: cat, price });
    Modal.close();
    Toast.show('Đã thêm món mới!', 'success');
    this.renderMenuPage();
  },

  editMenuItemModal(itemId) {
    const item = Store.getMenu().find(m => m.id === itemId);
    if (!item) return;
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('pencil',20)} Sửa món</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Emoji icon</label>
            <input type="text" id="ei-emoji" class="form-control" value="${item.emoji}" maxlength="4">
          </div>
          <div class="form-group">
            <label class="form-label">Danh mục</label>
            <select id="ei-cat" class="form-control">
              ${['Thức uống','Đồ ăn nhẹ','Khác'].map(c =>
                `<option ${c===item.category?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên món</label>
          <input type="text" id="ei-name" class="form-control" value="${item.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Giá bán (VNĐ)</label>
          <input type="number" id="ei-price" class="form-control" value="${item.price}" min="0" step="1000">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-primary" onclick="App._saveMenuItemEdit('${itemId}')">
            ${ic('save')} Lưu thay đổi
          </button>
        </div>
      </div>`);
  },

  _saveMenuItemEdit(itemId) {
    const name  = document.getElementById('ei-name').value.trim();
    const emoji = document.getElementById('ei-emoji').value.trim() || '🍽️';
    const cat   = document.getElementById('ei-cat').value;
    const price = parseInt(document.getElementById('ei-price').value) || 0;
    if (!name) { Toast.show('Vui lòng nhập tên món!', 'error'); return; }
    Store.updateMenuItem(itemId, { name, emoji, category: cat, price });
    Modal.close();
    Toast.show('Đã cập nhật!', 'success');
    this.renderMenuPage();
  },

  deleteMenuItem(itemId) {
    const item = Store.getMenu().find(m => m.id === itemId);
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" style="color:var(--danger)">${ic('trash-2',20)} Xóa món</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:24px">
          Xóa <strong style="color:var(--text-primary)">${item.emoji} ${item.name}</strong>?
        </p>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-danger" onclick="App._doDeleteMenuItem('${itemId}')">
            ${ic('trash-2')} Xóa
          </button>
        </div>
      </div>`);
  },

  _doDeleteMenuItem(id) {
    Store.deleteMenuItem(id);
    Modal.close();
    Toast.show('Đã xóa món!', 'info');
    this.renderMenuPage();
  },

  // ────────────────────────────── CAFE BILL ──────────────────────────────

  // Cart state for the cafe-only bill page
  _cafeCart: [],

  renderCafeBill() {
    this._cafeCart = [];
    this._drawCafeBillPage();
  },

  _drawCafeBillPage() {
    const menu = Store.getMenu();
    const cats = ['Tất cả', ...new Set(menu.map(m => m.category))];
    const grid = document.getElementById('cafe-menu-grid');
    const catFilters = document.getElementById('cafe-cat-filters');
    if (!grid) return;

    if (catFilters) {
      catFilters.innerHTML = cats.map(c => `
        <button class="food-cat-tab ${c === 'Tất cả' ? 'active' : ''}"
          data-cat="${c}" onclick="App._filterCafeMenu('${c}')">${c}</button>`).join('');
    }

    this._renderCafeMenuGrid('Tất cả');
    this._renderCafeCart();
  },

  _renderCafeMenuGrid(cat) {
    const menu     = Store.getMenu();
    const filtered = cat === 'Tất cả' ? menu : menu.filter(m => m.category === cat);
    const grid     = document.getElementById('cafe-menu-grid');
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${ic('package',32)}<p>Không có món</p></div>`;
      lucide.createIcons({ nodes: [grid] });
      return;
    }
    grid.innerHTML = filtered.map(item => {
      const imgHtml = item.image
        ? `<img class="item-img" src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">`
        : `<div style="font-size:32px;margin-bottom:6px">${item.emoji}</div>`;
      return `
        <div class="cafe-menu-item" onclick="App._cafeAddItem('${item.id}')">
          ${imgHtml}
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatMoney(item.price)}</div>
        </div>`;
    }).join('');
  },

  _filterCafeMenu(cat) {
    document.querySelectorAll('#cafe-cat-filters .food-cat-tab').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.cat === cat));
    this._renderCafeMenuGrid(cat);
  },

  _cafeAddItem(menuItemId) {
    const item = Store.getMenu().find(m => m.id === menuItemId);
    if (!item) return;
    const existing = this._cafeCart.find(c => c.menuItemId === menuItemId);
    if (existing) {
      existing.quantity++;
    } else {
      this._cafeCart.push({ menuItemId: item.id, name: item.name, emoji: item.emoji, price: item.price, quantity: 1 });
    }
    this._renderCafeCart();
    Toast.show(`+ ${item.name}`, 'success', 900);
  },

  _cafeChangeQty(menuItemId, delta) {
    const idx = this._cafeCart.findIndex(c => c.menuItemId === menuItemId);
    if (idx < 0) return;
    this._cafeCart[idx].quantity += delta;
    if (this._cafeCart[idx].quantity <= 0) this._cafeCart.splice(idx, 1);
    this._renderCafeCart();
  },

  _renderCafeCart() {
    const listEl  = document.getElementById('cafe-cart-list');
    const totalEl = document.getElementById('cafe-cart-total');
    const payBtn  = document.getElementById('cafe-pay-btn');
    if (!listEl) return;

    const total = this._cafeCart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (totalEl) totalEl.textContent = formatMoney(total);
    if (payBtn)  payBtn.disabled = this._cafeCart.length === 0;

    if (this._cafeCart.length === 0) {
      listEl.innerHTML = `<div class="order-empty">${ic('shopping-cart', 40)}<p>Chưa có món nào<br><small>Bấm vào món bên trái để thêm</small></p></div>`;
      lucide.createIcons({ nodes: [listEl] });
      return;
    }
    listEl.innerHTML = this._cafeCart.map(item => `
      <div class="cafe-cart-item">
        <span class="cafe-cart-item-name">${item.emoji} ${item.name}</span>
        <div class="qty-control">
          <button class="qty-btn" onclick="App._cafeChangeQty('${item.menuItemId}', -1)">${ic('minus', 11)}</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="App._cafeChangeQty('${item.menuItemId}', 1)">${ic('plus', 11)}</button>
        </div>
        <span class="cafe-cart-item-total">${formatMoney(item.price * item.quantity)}</span>
      </div>`).join('');
    lucide.createIcons({ nodes: [listEl] });
  },

  cafeBillCheckout() {
    if (!this._cafeCart.length) { Toast.show('Chưa có món nào!', 'warning'); return; }
    const subtotal = this._cafeCart.reduce((s, i) => s + i.price * i.quantity, 0);
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('receipt', 18)} Thanh toán — Bill Cafe</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="checkout-section">
          <div class="checkout-section-title">${ic('coffee', 13)} Đồ uống & Đồ ăn</div>
          ${this._cafeCart.map(item => `
            <div class="checkout-row">
              <span>${item.emoji} ${item.name} × ${item.quantity}</span>
              <span class="value">${formatMoney(item.price * item.quantity)}</span>
            </div>`).join('')}
        </div>
        <div class="checkout-section">
          <div class="checkout-section-title">${ic('tag', 13)} Giảm giá</div>
          <div class="discount-row">
            <span class="discount-label">Giảm</span>
            <input type="number" id="cafe-discount-pct" class="form-control discount-input"
              value="0" min="0" max="100"
              oninput="App._updateCafeTotal(${subtotal})">
            <span class="discount-label">%</span>
            <span class="discount-amount" id="cafe-discount-amount">— 0đ</span>
          </div>
        </div>
        <div class="checkout-total-bar">
          <span>TỔNG CỘNG</span>
          <span id="cafe-checkout-total">${formatMoney(subtotal)}</span>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-ghost" onclick="App._finalizeCafeBill(false)">
            ${ic('check')} Thanh toán
          </button>
          <button class="btn btn-primary" onclick="App._finalizeCafeBill(true)">
            ${ic('printer')} Thanh toán & In
          </button>
        </div>
      </div>`);
  },

  _updateCafeTotal(subtotal) {
    const pct  = parseFloat(document.getElementById('cafe-discount-pct')?.value) || 0;
    const disc = Math.round(subtotal * pct / 100);
    const tot  = subtotal - disc;
    const discEl = document.getElementById('cafe-discount-amount');
    const totEl  = document.getElementById('cafe-checkout-total');
    if (discEl) discEl.textContent = `— ${formatMoney(disc)}`;
    if (totEl)  totEl.textContent  = formatMoney(tot);
  },

  _finalizeCafeBill(shouldPrint) {
    const discountPct = parseFloat(document.getElementById('cafe-discount-pct')?.value) || 0;
    const foodBill    = this._cafeCart.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount    = Math.round(foodBill * discountPct / 100);
    const total       = foodBill - discount;

    const invoice = Store.addInvoice({
      tableName:      'Bill Cafe',
      tableId:        null,
      pricePerHour:   0,
      startTime:      Date.now(),
      endTime:        Date.now(),
      elapsedSeconds: 0,
      tableBill:      0,
      foodItems:      [...this._cafeCart],
      foodBill,
      discountPct,
      discount,
      subtotal:       foodBill,
      total,
      type:           'cafe',
    });

    this._cafeCart = [];
    Modal.close();
    Toast.show(`Thanh toán ${formatMoney(total)} thành công! ☕`, 'success');
    this._renderCafeCart();
    if (shouldPrint) setTimeout(() => this._printCafeInvoice(invoice), 400);
  },

  _printCafeInvoice(invoice) {
    const settings = Store.getSettings();
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = `
      <div class="invoice-header">
        <div class="invoice-logo">☕</div>
        <div class="invoice-shop-name">${settings.shopName}</div>
        <div class="invoice-shop-info">${settings.shopAddress}</div>
        <div class="invoice-shop-info">Hotline: ${settings.shopPhone}</div>
        <div class="invoice-divider-dashed"></div>
        <div class="invoice-number">Bill Cafe #${invoice.id.replace('inv_','').slice(-6)}</div>
        <div class="invoice-date-text">${formatDateTime(invoice.createdAt)}</div>
      </div>
      <div class="invoice-section-title">ĐỒ UỐNG & ĐỒ ĂN</div>
      ${invoice.foodItems.map(item => `
        <div class="invoice-item">
          <span class="item-name">${item.emoji} ${item.name}</span>
          <span class="item-detail">× ${item.quantity}</span>
          <span class="item-price">${formatMoney(item.price * item.quantity)}</span>
        </div>`).join('')}
      <div class="invoice-divider-dashed"></div>
      ${invoice.discount > 0 ? `<div class="invoice-subtotal-row" style="color:#dc2626"><span>Giảm (${invoice.discountPct}%)</span><span>- ${formatMoney(invoice.discount)}</span></div>` : ''}
      <div class="invoice-total-bar">
        <span>TỔNG CỘNG</span>
        <span>${formatMoney(invoice.total)}</span>
      </div>
      <div class="invoice-footer">
        <div class="invoice-thank-you">${settings.footerNote}</div>
        <div>In lúc: ${formatDateTime(Date.now())}</div>
      </div>`;
    window.print();
  },

  // ────────────────────────────── SETTINGS ──────────────────────────────

  renderSettings() {
    const cfg = Store.getSettings();
    const s   = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    s('s-name',    cfg.shopName);
    s('s-address', cfg.shopAddress);
    s('s-phone',   cfg.shopPhone);
    s('s-price',   cfg.defaultPricePerHour);
    s('s-footer',  cfg.footerNote);
  },

  saveSettings() {
    Store.setSettings({
      shopName:            document.getElementById('s-name').value.trim(),
      shopAddress:         document.getElementById('s-address').value.trim(),
      shopPhone:           document.getElementById('s-phone').value.trim(),
      defaultPricePerHour: parseInt(document.getElementById('s-price').value) || 50000,
      footerNote:          document.getElementById('s-footer').value.trim(),
    });
    Toast.show('Đã lưu cài đặt!', 'success');
  },

  changePassword() {
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${ic('lock',20)} Đổi mật khẩu</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu hiện tại</label>
          <input type="password" id="pw-old" class="form-control" placeholder="••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu mới</label>
          <input type="password" id="pw-new" class="form-control" placeholder="••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Xác nhận mật khẩu mới</label>
          <input type="password" id="pw-confirm" class="form-control" placeholder="••••••">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-primary" onclick="App._doChangePassword()">
            ${ic('lock')} Đổi mật khẩu
          </button>
        </div>
      </div>`);
  },

  _doChangePassword() {
    const old     = document.getElementById('pw-old').value;
    const nw      = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;
    const stored  = localStorage.getItem('thiencafe_password') || '1234';
    if (old !== stored)   { Toast.show('Mật khẩu hiện tại sai!', 'error');         return; }
    if (nw.length < 4)    { Toast.show('Mật khẩu mới quá ngắn (≥4 ký tự)!', 'error'); return; }
    if (nw !== confirm)   { Toast.show('Mật khẩu xác nhận không khớp!', 'error');  return; }
    localStorage.setItem('thiencafe_password', nw);
    Modal.close();
    Toast.show('Đã đổi mật khẩu thành công!', 'success');
  },

  resetAllData() {
    Modal.show(`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" style="color:var(--danger)">${ic('alert-triangle',20)} Xóa toàn bộ dữ liệu</div>
          <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
        </div>
        <div style="background:var(--danger-bg);border:1px solid var(--danger);border-radius:10px;padding:14px;margin-bottom:20px;color:var(--danger);font-size:13px;font-weight:700">
          ${ic('alert-triangle',16)} Cảnh báo: Toàn bộ lịch sử hóa đơn, doanh thu và cài đặt sẽ bị xóa. Không thể hoàn tác!
        </div>
        <div class="form-group">
          <label class="form-label">Nhập <strong>XOA LICH SU</strong> để xác nhận</label>
          <input type="text" id="reset-confirm" class="form-control" placeholder="XOA LICH SU">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
          <button class="btn btn-danger" onclick="App._doResetAll()">
            ${ic('trash-2')} Xóa tất cả
          </button>
        </div>
      </div>`);
    lucide.createIcons({ nodes: [Modal._overlay] });
  },

  _doResetAll() {
    const val = document.getElementById('reset-confirm')?.value;
    if (val !== 'XOA LICH SU') { Toast.show('Vui lòng nhập đúng cụm từ xác nhận!', 'error'); return; }
    Store.resetAll();
    Modal.close();
    Toast.show('Đã xóa toàn bộ dữ liệu và khôi phục mặc định!', 'warning');
    this.navigate('dashboard');
  },
};

// ==================== AUTH HELPERS (global) ====================

function logout() {
  Modal.show(`
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">${ic('log-out',20)} Đăng xuất</div>
        <button class="modal-close" onclick="Modal.close()">${ic('x')}</button>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:24px">Bạn có chắc muốn đăng xuất?</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">${ic('x')} Hủy</button>
        <button class="btn btn-danger" onclick="sessionStorage.removeItem('thiencafe_auth');window.location.href='index.html'">
          ${ic('log-out')} Đăng xuất
        </button>
      </div>
    </div>`);
}

window.App = App;

function bootApp() {
  if (!sessionStorage.getItem('thiencafe_auth')) {
    window.location.href = 'index.html';
    return;
  }
  App.init();
  if (window.lucide) {
    lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
