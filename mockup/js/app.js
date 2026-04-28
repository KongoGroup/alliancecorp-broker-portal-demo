// AllianceCorp Broker Portal — shared utilities and icons.
// All DOM construction goes through createElement/textContent. SVG icons
// are parsed from trusted hardcoded constants via DOMParser. No innerHTML.

const VIEW_STORAGE_KEY = 'ac_broker_view';

async function loadJSON(path) {
  const response = await fetch(path);
  return response.json();
}

function getView() {
  return localStorage.getItem(VIEW_STORAGE_KEY) || 'my';
}
function setView(view) {
  localStorage.setItem(VIEW_STORAGE_KEY, view);
}

function isLoggedIn() {
  return localStorage.getItem('ac_broker_authed') === '1';
}
function setLoggedIn() {
  localStorage.setItem('ac_broker_authed', '1');
}
function logout() {
  localStorage.removeItem('ac_broker_authed');
  localStorage.removeItem(VIEW_STORAGE_KEY);
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  if (hrs < 24) return hrs + ' hr ago';
  if (days < 7) return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  return formatDate(dateStr);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - now) / 86400000);
}
function formatAUD(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(amount);
}
function formatAUDCompact(amount) {
  if (amount == null) return '—';
  if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(2) + 'M';
  if (amount >= 1000) return '$' + Math.round(amount / 1000) + 'k';
  return formatAUD(amount);
}

// --- DOM helpers --------------------------------------------------------
function el(tag, opts) {
  const node = document.createElement(tag);
  if (!opts) return node;
  if (opts.className) node.className = opts.className;
  if (opts.id) node.id = opts.id;
  if (opts.text != null) node.textContent = String(opts.text);
  if (opts.attrs) {
    Object.keys(opts.attrs).forEach(function(k) { node.setAttribute(k, opts.attrs[k]); });
  }
  if (opts.style) {
    Object.keys(opts.style).forEach(function(k) { node.style[k] = opts.style[k]; });
  }
  if (opts.on) {
    Object.keys(opts.on).forEach(function(k) { node.addEventListener(k, opts.on[k]); });
  }
  if (opts.children) {
    opts.children.forEach(function(child) {
      if (child == null) return;
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    });
  }
  return node;
}

// --- Badges -------------------------------------------------------------
const STAGE_BADGE_MAP = {
  'PEC':         'badge-grey',
  'Discovery':   'badge-grey',
  'Strategy':    'badge-blue',
  'PWP':         'badge-blue',
  'EOI':         'badge-navy',
  'Contracts':   'badge-navy',
  'Settlement':  'badge-green'
};
const FINANCE_BADGE_MAP = {
  'Pre-Approval Pending':    'badge-grey',
  'Pre-Approval Received':   'badge-blue',
  'Awaiting Final Approval': 'badge-gold',
  'Final Approval Received': 'badge-green',
  'N/A':                     'badge-grey'
};
const STOCK_STATUS_MAP = {
  'Available':  'badge-green',
  'Reserved':   'badge-gold',
  'Allocated':  'badge-navy',
  'Sold':       'badge-grey'
};
const ACTION_BADGE_MAP = {
  'Settlement imminent':       'badge-green',
  'Awaiting final approval':   'badge-gold',
  'Awaiting valuation':        'badge-gold',
  'Awaiting pre-approval':     'badge-gold',
  'Awaiting EOI':              'badge-gold',
  'Awaiting EOI decision':     'badge-gold',
  'Awaiting SMSF deed':        'badge-grey',
  'Awaiting builder progress': 'badge-grey',
  'Discovery booked':          'badge-grey',
  'Final approval submitted':  'badge-blue',
  'Settled':                   'badge-grey'
};

function badgeNode(value, mapName) {
  const map = {
    stage:   STAGE_BADGE_MAP,
    finance: FINANCE_BADGE_MAP,
    stock:   STOCK_STATUS_MAP,
    action:  ACTION_BADGE_MAP
  }[mapName] || {};
  const cls = 'badge ' + (map[value] || 'badge-grey');
  return el('span', { className: cls, text: value });
}

// --- Icon helper (SVG) --------------------------------------------------
// Parses a trusted hardcoded SVG string into a DOM node via DOMParser
// (no innerHTML). Caller passes an icon name; only known names are accepted.
function iconNode(name, extraClass) {
  const svgString = icons[name];
  if (!svgString) return el('span');
  const parsed = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const node = parsed.querySelector('svg');
  if (!node) return el('span');
  const imported = document.importNode(node, true);
  if (extraClass) {
    const existing = imported.getAttribute('class') || '';
    imported.setAttribute('class', (existing + ' ' + extraClass).trim());
  }
  return imported;
}

// --- Toast --------------------------------------------------------------
function showToast(message, type) {
  type = type || 'success';
  let toast = document.getElementById('ac-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ac-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  const iconChar = { success: '✓', info: 'ℹ', warning: '⚠' }[type] || '✓';
  toast.textContent = '';
  toast.appendChild(el('span', { className: 'toast-icon', text: iconChar }));
  toast.appendChild(document.createTextNode(message));
  toast.className = 'toast show';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function() { toast.className = 'toast'; }, 3200);
}

// --- Modal --------------------------------------------------------------
// Accepts a DOM node (or array of nodes). No HTML strings.
function showModal(contentNode) {
  let overlay = document.getElementById('ac-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ac-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,26,89,0.5);display:flex;align-items:center;justify-content:center;z-index:200;opacity:0;transition:opacity 0.18s ease;';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }
  const existing = overlay.querySelector('.modal-content');
  if (existing) existing.remove();
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.cssText = 'background:white;max-width:520px;width:90%;padding:2rem;border-radius:4px;border-top:3px solid var(--ac-gold);box-shadow:0 24px 60px rgba(0,0,0,0.25);';
  if (Array.isArray(contentNode)) contentNode.forEach(function(n) { content.appendChild(n); });
  else if (contentNode) content.appendChild(contentNode);
  overlay.appendChild(content);
  requestAnimationFrame(function() { overlay.style.opacity = '1'; });
  document.addEventListener('keydown', _handleEscape);
}
function closeModal() {
  const overlay = document.getElementById('ac-modal-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(function() { overlay.remove(); }, 200);
    document.removeEventListener('keydown', _handleEscape);
  }
}
function _handleEscape(e) { if (e.key === 'Escape') closeModal(); }

// --- Tabs ---------------------------------------------------------------
function initTabs(containerSelector, callback) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      if (callback) callback(tab.dataset.tab);
    });
  });
}

// --- Stage progress bar -------------------------------------------------
const STAGE_ORDER = ['PEC', 'Discovery', 'Strategy', 'PWP', 'EOI', 'Contracts', 'Settlement'];

function renderStageBar(currentStage) {
  const idx = STAGE_ORDER.indexOf(currentStage);
  const bar = el('div', { className: 'stage-bar' });
  STAGE_ORDER.forEach(function(stage, i) {
    let cls = 'stage-step';
    if (i < idx) cls += ' complete';
    else if (i === idx) cls += ' current';
    bar.appendChild(el('div', {
      className: cls,
      children: [
        el('div', { className: 'stage-track' }),
        el('div', { className: 'stage-label', text: stage })
      ]
    }));
  });
  return bar;
}

// --- SVG icons (trusted hardcoded constants — parsed via DOMParser) -----
const icons = {
  dashboard: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  deals:     '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
  stock:     '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h14a1 1 0 001-1V10M9 21V12h6v9"/></svg>',
  resources: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
  finance:   '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  property:  '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
  valuation: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  documents: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  activity:  '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  search:    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
  filter:    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>',
  arrow:     '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>',
  chevDown:  '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>',
  download:  '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
  upload:    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>',
  plus:      '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>',
  bell:      '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
  user:      '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
  logout:    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>',
  bed:       '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10v10m0-10V6a2 2 0 012-2h14a2 2 0 012 2v4M3 10h18m-9 0v-2a2 2 0 012-2h3a2 2 0 012 2v2"/></svg>',
  car:       '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0M3 10v6a1 1 0 001 1h1m6-7l3-3h2l3 3M7 7l3-3h2l3 3M5 10h14m-9 0v6m4-6v6"/></svg>',
  bath:      '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11V5a2 2 0 012-2h6m4 8H5m12 0a2 2 0 012 2v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a2 2 0 012-2"/></svg>',
  pin:       '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  check:     '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
  alert:     '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
  pdf:       '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
};
