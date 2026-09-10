'use strict';

const Store = (() => {
  const PREFIX = 'thiencafe_';

  // ==================== DEFAULT DATA ====================

  const DEFAULT_MENU = [
    // Thức uống
    { id: 'drink_1',  category: 'Thức uống',  name: 'Cà phê đen',         price: 25000, emoji: '☕', image: 'assets/menu/ca_phe_den.jpg' },
    { id: 'drink_2',  category: 'Thức uống',  name: 'Cà phê sữa',         price: 30000, emoji: '☕', image: 'assets/menu/ca_phe_sua.jpg' },
    { id: 'drink_3',  category: 'Thức uống',  name: 'Bạc xỉu',            price: 30000, emoji: '🥛', image: 'assets/menu/bac_xiu.jpg' },
    { id: 'drink_4',  category: 'Thức uống',  name: 'Trà sữa trân châu',  price: 35000, emoji: '🧋', image: 'assets/menu/tra_sua.jpg' },
    { id: 'drink_5',  category: 'Thức uống',  name: 'Sinh tố dâu',        price: 35000, emoji: '🍓', image: 'assets/menu/sinh_to.jpg' },
    { id: 'drink_6',  category: 'Thức uống',  name: 'Nước cam ép',        price: 25000, emoji: '🍊', image: 'assets/menu/sinh_to.jpg' },
    { id: 'drink_7',  category: 'Thức uống',  name: 'Coca Cola',          price: 20000, emoji: '🥤', image: 'assets/menu/nuoc_ngot.jpg' },
    { id: 'drink_8',  category: 'Thức uống',  name: 'Pepsi',              price: 20000, emoji: '🥤', image: 'assets/menu/pepsi.jpg' },
    { id: 'drink_9',  category: 'Thức uống',  name: 'Trà đào cam sả',    price: 30000, emoji: '🍑', image: 'assets/menu/tra_dao.jpg' },
    { id: 'drink_10', category: 'Thức uống',  name: 'Nước lọc',           price: 10000, emoji: '💧', image: 'assets/menu/nuoc_loc.jpg' },
    { id: 'drink_11', category: 'Thức uống',  name: 'Hồng trà sữa',      price: 30000, emoji: '🍵', image: 'assets/menu/hong_tra.jpg' },
    { id: 'drink_12', category: 'Thức uống',  name: 'Matcha latte',       price: 40000, emoji: '🍵', image: 'assets/menu/matcha.jpg' },
    { id: 'drink_13', category: 'Thức uống',  name: 'Bia lon',            price: 25000, emoji: '🍺', image: 'assets/menu/bia.jpg' },
    // Đồ ăn nhẹ
    { id: 'food_1',   category: 'Đồ ăn nhẹ', name: 'Snack khoai tây',    price: 15000, emoji: '🥔', image: 'assets/menu/snack.jpg' },
    { id: 'food_2',   category: 'Đồ ăn nhẹ', name: 'Bánh mì pate',       price: 20000, emoji: '🥖', image: 'assets/menu/banh_mi.jpg' },
    { id: 'food_3',   category: 'Đồ ăn nhẹ', name: 'Mì ly Hảo Hảo',     price: 15000, emoji: '🍜', image: 'assets/menu/mi_ly.jpg' },
    { id: 'food_4',   category: 'Đồ ăn nhẹ', name: 'Xúc xích nướng',    price: 25000, emoji: '🌭', image: 'assets/menu/xuc_xich.jpg' },
    { id: 'food_5',   category: 'Đồ ăn nhẹ', name: 'Bánh quy',           price: 15000, emoji: '🍪', image: 'assets/menu/banh_quy.jpg' },
    { id: 'food_6',   category: 'Đồ ăn nhẹ', name: 'Bắp rang bơ',       price: 25000, emoji: '🍿', image: 'assets/menu/snack.jpg' },
    { id: 'food_7',   category: 'Đồ ăn nhẹ', name: 'Sandwich trứng',     price: 25000, emoji: '🥪', image: 'assets/menu/sandwich.jpg' },
    // Khác
    { id: 'other_1',  category: 'Khác',       name: 'Kẹo',                price: 5000,  emoji: '🍬', image: 'assets/menu/keo.jpg' },
    { id: 'other_2',  category: 'Khác',       name: 'Thuốc lá',           price: 30000, emoji: '🚬', image: 'assets/menu/thuoc_la.jpg' },
    { id: 'other_3',  category: 'Khác',       name: 'Snack Oishi',        price: 10000, emoji: '🍟', image: 'assets/menu/snack_oishi.jpg' },
  ];


  const DEFAULT_TABLES = [
    { id: 'table_1', name: 'Bàn 1', type: 'standard', pricePerHour: 50000 },
    { id: 'table_2', name: 'Bàn 2', type: 'standard', pricePerHour: 50000 },
    { id: 'table_3', name: 'Bàn 3', type: 'standard', pricePerHour: 50000 },
    { id: 'table_4', name: 'Bàn 4', type: 'standard', pricePerHour: 50000 },
  ];

  const DEFAULT_SETTINGS = {
    shopName: 'Thien Cafe - Billiards',
    shopAddress: 'Ngọc Sơn, Hành Thiện, Quảng Ngãi',
    shopPhone: '0901 234 567',
    defaultPricePerHour: 50000,
    footerNote: 'Cảm ơn quý khách! Hẹn gặp lại! 🎱',
  };

  // ==================== PRIVATE HELPERS ====================

  const _get = (key) => {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); }
    catch { return null; }
  };

  const _set = (key, value) => localStorage.setItem(PREFIX + key, JSON.stringify(value));

  // ==================== INIT ====================

  const init = () => {
    if (!_get('initialized')) {
      _set('tables', DEFAULT_TABLES);
      _set('menu', DEFAULT_MENU);
      _set('settings', DEFAULT_SETTINGS);
      _set('sessions', {});
      _set('invoices', []);
      _set('initialized', true);
    }
  };

  // ==================== TABLES ====================

  const getTables = () => _get('tables') || [];
  const _setTables = (t) => _set('tables', t);
  const getTable = (id) => getTables().find(t => t.id === id) || null;

  const addTable = (data) => {
    const tables = getTables();
    const table = { ...data, id: `table_${Date.now()}` };
    tables.push(table);
    _setTables(tables);
    return table;
  };

  const updateTable = (id, data) => _setTables(getTables().map(t => t.id === id ? { ...t, ...data } : t));
  const deleteTable = (id) => _setTables(getTables().filter(t => t.id !== id));

  // ==================== SESSIONS ====================

  const getSessions = () => _get('sessions') || {};
  const _setSessions = (s) => _set('sessions', s);
  const getSession = (tableId) => getSessions()[tableId] || null;

  const startSession = (tableId) => {
    const sessions = getSessions();
    sessions[tableId] = {
      tableId,
      startTime: Date.now(),
      pausedDuration: 0,
      isPaused: false,
      pauseStart: null,
      items: [],
    };
    _setSessions(sessions);
    return sessions[tableId];
  };

  const pauseSession = (tableId) => {
    const sessions = getSessions();
    if (sessions[tableId] && !sessions[tableId].isPaused) {
      sessions[tableId].isPaused = true;
      sessions[tableId].pauseStart = Date.now();
      _setSessions(sessions);
    }
  };

  const resumeSession = (tableId) => {
    const sessions = getSessions();
    if (sessions[tableId] && sessions[tableId].isPaused) {
      sessions[tableId].pausedDuration += Date.now() - sessions[tableId].pauseStart;
      sessions[tableId].isPaused = false;
      sessions[tableId].pauseStart = null;
      _setSessions(sessions);
    }
  };

  const endSession = (tableId) => {
    const sessions = getSessions();
    const session = { ...sessions[tableId] };
    delete sessions[tableId];
    _setSessions(sessions);
    return session;
  };

  const addItemToSession = (tableId, item) => {
    const sessions = getSessions();
    if (!sessions[tableId]) return;
    const existing = sessions[tableId].items.find(i => i.menuItemId === item.menuItemId);
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      sessions[tableId].items.push({ ...item, quantity: item.quantity || 1 });
    }
    _setSessions(sessions);
  };

  const updateSessionItem = (tableId, menuItemId, quantity) => {
    const sessions = getSessions();
    if (!sessions[tableId]) return;
    if (quantity <= 0) {
      sessions[tableId].items = sessions[tableId].items.filter(i => i.menuItemId !== menuItemId);
    } else {
      const item = sessions[tableId].items.find(i => i.menuItemId === menuItemId);
      if (item) item.quantity = quantity;
    }
    _setSessions(sessions);
  };

  // ==================== INVOICES ====================

  const getInvoices = () => _get('invoices') || [];

  const addInvoice = (data) => {
    const invoices = getInvoices();
    const invoice = { ...data, id: `inv_${Date.now()}`, createdAt: Date.now() };
    invoices.unshift(invoice);
    _set('invoices', invoices);
    return invoice;
  };

  const deleteInvoice = (id) => _set('invoices', getInvoices().filter(i => i.id !== id));

  // ==================== MENU ====================

  const getMenu = () => _get('menu') || DEFAULT_MENU;
  const _setMenu = (m) => _set('menu', m);

  const addMenuItem = (data) => {
    const menu = getMenu();
    const item = { ...data, id: `item_${Date.now()}` };
    menu.push(item);
    _setMenu(menu);
    return item;
  };

  const updateMenuItem = (id, data) => _setMenu(getMenu().map(m => m.id === id ? { ...m, ...data } : m));
  const deleteMenuItem = (id) => _setMenu(getMenu().filter(m => m.id !== id));

  // ==================== SETTINGS ====================

  const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(_get('settings') || {}) });
  const setSettings = (data) => _set('settings', { ...getSettings(), ...data });

  // ==================== BILLING CALCULATIONS ====================

  /**
   * Returns total elapsed seconds for a session (excluding paused time).
   */
  const getElapsedSeconds = (session) => {
    if (!session) return 0;
    const now = Date.now();
    const refTime = session.isPaused ? session.pauseStart : now;
    const elapsed = refTime - session.startTime - session.pausedDuration;
    return Math.max(0, Math.floor(elapsed / 1000));
  };

  /**
   * Calculates table bill (time × price).
   */
  const calcTableBill = (session, pricePerHour) => {
    const secs = getElapsedSeconds(session);
    return Math.round((secs / 3600) * pricePerHour);
  };

  /**
   * Calculates total food/drink bill.
   */
  const calcFoodBill = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);

  // ==================== RESET ====================

  const resetAll = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
    init();
  };

  // ==================== PUBLIC API ====================
  return {
    init, resetAll,
    getTables, getTable, addTable, updateTable, deleteTable,
    getSessions, getSession, startSession, pauseSession, resumeSession, endSession,
    addItemToSession, updateSessionItem,
    getInvoices, addInvoice, deleteInvoice,
    getMenu, addMenuItem, updateMenuItem, deleteMenuItem,
    getSettings, setSettings,
    getElapsedSeconds, calcTableBill, calcFoodBill,
  };
})();

window.Store = Store;
