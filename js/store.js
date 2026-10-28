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

  // Giá được tính theo thời điểm thực tế khách chơi. Mỗi khung bao gồm cả phút kết thúc.
  const TIME_RATES = {
    libre: [
      { label: '06:00–12:00', startMinute: 360, endMinute: 720, rate: 29000 },
      { label: '12:01–21:00', startMinute: 721, endMinute: 1260, rate: 34000 },
      { label: '21:01–05:59', startMinute: 1261, endMinute: 359, rate: 39000 },
    ],
    pocket: [
      { label: '06:00–12:00', startMinute: 360, endMinute: 720, rate: 29000 },
      { label: '12:01–21:00', startMinute: 721, endMinute: 1260, rate: 39000 },
      { label: '21:01–05:59', startMinute: 1261, endMinute: 359, rate: 44000 },
    ],
  };
  const DEFAULT_MEMBERS = [];

  const DEFAULT_SETTINGS = {
    shopName: 'Thien Cafe - Billiards',
    shopAddress: 'Ngọc Sơn, Hành Thiện, Quảng Ngãi',
    shopPhone: '0901 234 567',
    defaultPricePerHour: 50000,
    depositBonusPct: 20,
    footerNote: 'Cảm ơn quý khách! Hẹn gặp lại!',
  };

  // Hạng thành viên mặc định — admin có thể chỉnh % giảm trong Cài đặt
  const DEFAULT_RANK_SETTINGS = [
    { id: 'dong',    label: 'Đồng',      icon: 'medal',  minPoints: 0,   discount: 0  },
    { id: 'bac',     label: 'Bạc',       icon: 'award',  minPoints: 50,  discount: 3  },
    { id: 'vang',    label: 'Vàng',      icon: 'trophy', minPoints: 200, discount: 5  },
    { id: 'diamond', label: 'Kim cương', icon: 'gem',    minPoints: 500, discount: 10 },
  ];

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
      _set('members', DEFAULT_MEMBERS);
      _set('rankSettings', DEFAULT_RANK_SETTINGS);
      _set('initialized', true);
    }
    // Migrate: ensure members key exists for older localStorage
    if (_get('members')      === null) _set('members',      DEFAULT_MEMBERS);
    // Migrate: ensure rankSettings key exists for older localStorage
    if (_get('rankSettings') === null) _set('rankSettings', DEFAULT_RANK_SETTINGS);
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
    const now = Date.now();
    const sessions = getSessions();
    sessions[tableId] = {
      tableId,
      startTime: now,
      pausedDuration: 0,
      isPaused: false,
      pauseStart: null,
      activeSegments: [{ start: now, end: null }],
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
      const segments = sessions[tableId].activeSegments || [{ start: sessions[tableId].startTime, end: null }];
      if (segments.length) segments[segments.length - 1].end = sessions[tableId].pauseStart;
      sessions[tableId].activeSegments = segments;
      _setSessions(sessions);
    }
  };

  const resumeSession = (tableId) => {
    const sessions = getSessions();
    if (sessions[tableId] && sessions[tableId].isPaused) {
      sessions[tableId].pausedDuration += Date.now() - sessions[tableId].pauseStart;
      sessions[tableId].isPaused = false;
      sessions[tableId].pauseStart = null;
      if (!sessions[tableId].activeSegments) sessions[tableId].activeSegments = [];
      sessions[tableId].activeSegments.push({ start: Date.now(), end: null });
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

  // ==================== MEMBERS ====================

  const getMembers = () => {
    const members = _get('members') || [];
    return members.map(m => ({
      ...m,
      balance: m.balance ?? 0,
      depositHistory: m.depositHistory || [],
      paymentHistory: m.paymentHistory || [],
    }));
  };

  const _setMembers = (m) => _set('members', m);
  const getMember = (id) => getMembers().find(m => m.id === id) || null;

  const addMember = (data) => {
    const members = getMembers();
    const member = {
      ...data,
      id: `mem_${Date.now()}`,
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      balance: 0,
      depositHistory: [],
      paymentHistory: [],
      createdAt: Date.now(),
    };
    members.push(member);
    _setMembers(members);
    return member;
  };

  const updateMember = (id, data) =>
    _setMembers(getMembers().map(m => m.id === id ? { ...m, ...data } : m));

  const deleteMember = (id) =>
    _setMembers(getMembers().filter(m => m.id !== id));

  /**
   * Nộp tiền vào tài khoản thành viên - tính % khuyến mãi từ Settings
   */
  const depositMemberBalance = (id, amount, bonusPctOverride = null) => {
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Không tìm thấy thành viên');
    
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) throw new Error('Số tiền nộp phải lớn hơn 0');

    const defaultBonusPct = getDepositBonusPct();
    const bonusPct = bonusPctOverride === null || bonusPctOverride === ''
      ? defaultBonusPct
      : Math.max(0, Math.min(100, Math.round(Number(bonusPctOverride) || 0)));
    const bonusAmount = Math.round(numAmount * bonusPct / 100);
    const credit = numAmount + bonusAmount;

    const record = {
      id: `dep_${Date.now()}`,
      date: Date.now(),
      amount: numAmount,
      bonusPct,
      bonusAmount,
      credit,
    };

    const member = members[idx];
    member.balance = (member.balance || 0) + credit;
    if (!member.depositHistory) member.depositHistory = [];
    member.depositHistory.unshift(record);

    _setMembers(members);
    return { member, record };
  };

  /**
   * Trừ tiền trong tài khoản khi thanh toán bằng số dư thành viên
   */
  const deductMemberBalance = (id, amount, invoiceId = null, note = '') => {
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Không tìm thấy thành viên');

    const numAmount = Number(amount) || 0;
    const member = members[idx];
    const currentBalance = member.balance || 0;

    // Cho phép số dư âm khi thanh toán (ghi nợ thành viên)
    const record = {
      id: `pay_${Date.now()}`,
      date: Date.now(),
      amount: numAmount,
      invoiceId,
      note,
    };

    member.balance = currentBalance - numAmount;
    if (!member.paymentHistory) member.paymentHistory = [];
    member.paymentHistory.unshift(record);

    _setMembers(members);
    return { member, record };
  };

  /**
   * Adds points, increments visitCount, and adds to totalSpent.
   * @param {string} id - member id
   * @param {number} pointsToAdd
   * @param {number} amountSpent
   */
  const addMemberPoints = (id, pointsToAdd, amountSpent = 0) => {
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx === -1) return;
    members[idx].points      = (members[idx].points      || 0) + pointsToAdd;
    members[idx].totalSpent  = (members[idx].totalSpent  || 0) + amountSpent;
    members[idx].visitCount  = (members[idx].visitCount  || 0) + 1;
    members[idx].lastVisit   = Date.now();
    _setMembers(members);
  };

  // ==================== RANK SETTINGS ====================

  const getRankSettings = () => _get('rankSettings') || DEFAULT_RANK_SETTINGS;
  const setRankSettings = (data) => _set('rankSettings', data);

  // ==================== SETTINGS ====================

  const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(_get('settings') || {}) });
  const setSettings = (data) => _set('settings', { ...getSettings(), ...data });

  const getDepositBonusPct = () => {
    const settings = getSettings();
    const pct = Number(settings.depositBonusPct);
    return isNaN(pct) ? 20 : Math.max(0, Math.min(100, pct));
  };

  const setDepositBonusPct = (pct) => {
    const val = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    setSettings({ depositBonusPct: val });
  };

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

  const normalizeTableType = (type) => type === 'pocket' || type === 'lo' ? 'pocket' : 'libre';

  const getTimeRate = (tableType, timestamp) => {
    const date = new Date(timestamp);
    const minute = date.getHours() * 60 + date.getMinutes();
    const rates = TIME_RATES[normalizeTableType(tableType)];
    return rates.find(({ startMinute, endMinute }) =>
      startMinute <= endMinute
        ? minute >= startMinute && minute <= endMinute
        : minute >= startMinute || minute <= endMinute,
    );
  };

  const getRateSchedule = (tableType) => TIME_RATES[normalizeTableType(tableType)];

  const calcSegmentBill = (start, end, tableType) => {
    let cursor = start;
    let total = 0;
    while (cursor < end) {
      const current = new Date(cursor);
      const nextMinute = new Date(current);
      nextMinute.setSeconds(0, 0);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);
      const sliceEnd = Math.min(end, nextMinute.getTime());
      if (sliceEnd <= cursor) {
        cursor = end;
        break;
      }
      const rateObj = getTimeRate(tableType, cursor);
      const rate = rateObj ? rateObj.rate : 30000;
      total += ((sliceEnd - cursor) / 3600000) * rate;
      cursor = sliceEnd;
    }
    return total;
  };

  /** Calculates the bill across each active time band; paused time is excluded. */
  const calcTableBill = (session, tableType) => {
    if (!session) return 0;
    const now = session.isPaused ? session.pauseStart : Date.now();
    if (!session.activeSegments || session.activeSegments.length === 0) {
      const rateObj = getTimeRate(tableType, now);
      const rate = rateObj ? rateObj.rate : 30000;
      return Math.round((getElapsedSeconds(session) / 3600) * rate);
    }
    return Math.round(session.activeSegments.reduce((total, segment) =>
      total + calcSegmentBill(segment.start, segment.end || now, tableType), 0));
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
    getMembers, getMember, addMember, updateMember, deleteMember, addMemberPoints,
    depositMemberBalance, deductMemberBalance,
    getDepositBonusPct, setDepositBonusPct,
    getSettings, setSettings,
    getRankSettings, setRankSettings,
    getElapsedSeconds, calcTableBill, calcFoodBill, getTimeRate, getRateSchedule, normalizeTableType,
  };
})();

window.Store = Store;
