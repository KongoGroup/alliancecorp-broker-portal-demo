// AllianceCorp Broker Portal — shared header (with view toggle) and footer.
// Pure DOM construction; depends on app.js (icons, helpers, getView/setView).

// Cached broker info — loaded once per page, used by header.
let __brokerCache = null;
async function getBroker() {
  if (__brokerCache) return __brokerCache;
  __brokerCache = await loadJSON('data/broker.json');
  return __brokerCache;
}

const NAV_LINKS = [
  { href: 'dashboard.html',     label: 'Dashboard',      id: 'dashboard', icon: 'dashboard' },
  { href: 'deals.html',         label: 'My Deals',       id: 'deals',     icon: 'deals' },
  { href: 'stock.html',         label: 'Stock Pipeline', id: 'stock',     icon: 'stock' },
  { href: 'resources.html',     label: 'Resources',      id: 'resources', icon: 'resources' }
];

function currentPageId() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  if (path === '' || path === 'dashboard.html' || path === 'index.html') return 'dashboard';
  if (path.indexOf('deal-detail') === 0) return 'deals';
  return path.replace('.html', '');
}

async function renderHeader() {
  const mount = document.getElementById('app-header');
  if (!mount) return;

  const broker = await getBroker();
  const active = currentPageId();

  // --- Top bar (navy) --------------------------------------------------
  const topBarOuter = el('div', { className: 'app-header-top' });
  const topBar = el('div', {
    className: 'app-header-inner flex items-center justify-between',
    style: { height: '70px' }
  });
  topBarOuter.appendChild(topBar);

  // Logo cluster — the AllianceCorp logo has white text and a gold A mark,
  // designed to sit on a dark navy background. Now that the top bar is navy
  // the logo can show directly without a backdrop wrapper.
  const logoLink = el('a', {
    attrs: { href: 'dashboard.html' },
    className: 'flex items-center gap-3'
  });
  const logoImg = el('img', {
    attrs: {
      src: 'https://www.alliancecorp.com.au/wp-content/uploads/2023/05/cropped-AC-WEBSITE-WIREFRAME-1.png',
      alt: 'AllianceCorp',
      width: '90',
      height: '40'
    },
    style: { height: '40px', width: '90px', display: 'block', flexShrink: '0' }
  });
  const dividerEl = el('span', {
    style: {
      width: '1px',
      height: '28px',
      background: 'rgba(255,255,255,0.20)',
      margin: '0 0.4rem'
    }
  });
  const portalLabel = el('span', {
    text: 'Broker Portal',
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: '0.7rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '2.5px',
      color: 'rgba(255,255,255,0.7)'
    }
  });
  logoLink.appendChild(logoImg);
  logoLink.appendChild(dividerEl);
  logoLink.appendChild(portalLabel);

  // User cluster (right)
  const userCluster = el('div', { className: 'flex items-center gap-4' });

  // View toggle (key demo feature) — only visible on dashboard / deals
  if (active === 'dashboard' || active === 'deals') {
    userCluster.appendChild(buildViewToggle(broker.firm.name));
  }

  // Avatar + broker info — sits on navy top bar, so text is white and the
  // avatar swaps to gold for contrast.
  const userBlock = el('div', {
    className: 'flex items-center gap-3',
    style: { paddingLeft: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.20)' }
  });
  const userInfo = el('div', { style: { textAlign: 'right', lineHeight: '1.15' } });
  userInfo.appendChild(el('div', {
    style: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--ac-white)' },
    text: broker.broker.name
  }));
  userInfo.appendChild(el('div', {
    style: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.4px' },
    text: broker.firm.name
  }));
  const avatar = el('div', {
    className: 'flex items-center justify-center',
    style: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'var(--ac-gold)',
      color: 'var(--ac-white)',
      fontFamily: 'var(--font-heading)',
      fontWeight: '700',
      letterSpacing: '0.5px',
      fontSize: '0.85rem',
      cursor: 'pointer'
    },
    text: broker.broker.initials,
    on: {
      click: function() {
        const confirmLogout = window.confirm('Sign out of the broker portal?');
        if (confirmLogout) logout();
      }
    },
    attrs: { title: 'Click to sign out (demo)' }
  });
  userBlock.appendChild(userInfo);
  userBlock.appendChild(avatar);
  userCluster.appendChild(userBlock);

  topBar.appendChild(logoLink);
  topBar.appendChild(userCluster);

  // --- Nav row (white) -------------------------------------------------
  const navRow = el('nav', {
    className: 'app-header-inner flex items-center'
  });
  NAV_LINKS.forEach(function(link) {
    const a = el('a', {
      attrs: { href: link.href },
      className: 'app-nav-link' + (active === link.id ? ' active' : '')
    });
    const icon = iconNode(link.icon);
    icon.setAttribute('class', (icon.getAttribute('class') || '') + ' w-4 h-4');
    a.appendChild(icon);
    a.appendChild(el('span', { text: link.label }));
    navRow.appendChild(a);
  });

  // --- Assemble --------------------------------------------------------
  const headerEl = el('header', { className: 'app-header' });
  headerEl.appendChild(topBarOuter);
  headerEl.appendChild(navRow);

  mount.textContent = '';
  mount.appendChild(headerEl);
}

function buildViewToggle(firmName) {
  const wrapper = el('div', {
    className: 'flex items-center gap-3',
    style: { paddingRight: '0.5rem' }
  });
  wrapper.appendChild(el('span', {
    text: 'View',
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: '0.65rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      color: 'rgba(255,255,255,0.5)'
    }
  }));

  const toggle = el('div', { className: 'view-toggle' });
  const view = getView();

  const myBtn = el('button', {
    className: view === 'my' ? 'active' : '',
    attrs: { type: 'button', 'data-view': 'my' },
    text: 'My Deals'
  });
  const firmBtn = el('button', {
    className: view === 'firm' ? 'active' : '',
    attrs: { type: 'button', 'data-view': 'firm' },
    text: 'Firm: ' + (firmName.length > 22 ? firmName.split(' ')[0] : firmName)
  });

  function applyToggle(newView) {
    if (newView === getView()) return;
    setView(newView);
    myBtn.classList.toggle('active', newView === 'my');
    firmBtn.classList.toggle('active', newView === 'firm');
    document.dispatchEvent(new CustomEvent('viewchange', { detail: { view: newView } }));
    showToast(
      newView === 'firm'
        ? 'Switched to firm-wide view — showing all deals from ' + firmName
        : 'Switched to your deals only',
      'info'
    );
  }
  myBtn.addEventListener('click', function() { applyToggle('my'); });
  firmBtn.addEventListener('click', function() { applyToggle('firm'); });

  toggle.appendChild(myBtn);
  toggle.appendChild(firmBtn);
  wrapper.appendChild(toggle);
  return wrapper;
}

function renderFooter() {
  const mount = document.getElementById('app-footer');
  if (!mount) return;
  const inner = el('div', { className: 'app-footer-inner' });
  inner.appendChild(el('div', {
    className: 'flex justify-between items-center',
    style: { flexWrap: 'wrap', gap: '1rem' },
    children: [
      el('span', { text: '© 2026 AllianceCorp Property. Broker Portal Demo.' }),
      el('span', { className: 'powered', text: 'Powered by HubSpot Content Hub · Private Content' })
    ]
  }));
  mount.textContent = '';
  mount.appendChild(inner);
}

document.addEventListener('DOMContentLoaded', function() {
  renderHeader();
  renderFooter();
});
