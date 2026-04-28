// My Deals — filterable table with My / Firm view toggle.

requireAuth();

let __broker = null;
let __deals = [];

document.addEventListener('DOMContentLoaded', async function () {
  try {
    [__broker, __deals] = await Promise.all([
      loadJSON('data/broker.json'),
      loadJSON('data/deals.json')
    ]);
  } catch (e) {
    console.error('Failed to load deals data', e);
    return;
  }

  // Wire filter inputs
  ['filter-search', 'filter-stage', 'filter-finance', 'filter-settlement'].forEach(function(id) {
    const node = document.getElementById(id);
    if (node) node.addEventListener('input', applyFiltersAndRender);
  });
  document.getElementById('clear-filters').addEventListener('click', function() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-stage').value = '';
    document.getElementById('filter-finance').value = '';
    document.getElementById('filter-settlement').value = '';
    applyFiltersAndRender();
  });

  applyFiltersAndRender();
  document.addEventListener('viewchange', applyFiltersAndRender);
});

function applyFiltersAndRender() {
  const view = getView();
  const search = document.getElementById('filter-search').value.toLowerCase().trim();
  const stage = document.getElementById('filter-stage').value;
  const finance = document.getElementById('filter-finance').value;
  const settlementWindow = document.getElementById('filter-settlement').value;

  // Title + subtitle reflect view
  const title = view === 'firm' ? __broker.firm.name + ' — All Deals' : 'My Deals';
  document.getElementById('deals-title').textContent = title;
  document.getElementById('deals-subtitle').textContent = view === 'firm'
    ? 'You are seeing every active deal across the firm. Toggle to "My Deals" to filter to your pipeline only.'
    : 'Your AllianceCorp pipeline — click any deal to update finance fields, view the property, or chase a valuation.';

  // Show / hide broker column
  document.getElementById('broker-col').style.display = view === 'firm' ? '' : 'none';

  let filtered = __deals.slice();
  if (view !== 'firm') {
    filtered = filtered.filter(function(d) { return d.broker_id === __broker.broker.id; });
  }
  if (search) {
    filtered = filtered.filter(function(d) {
      return d.client_name.toLowerCase().indexOf(search) > -1
          || (d.client_primary && d.client_primary.toLowerCase().indexOf(search) > -1)
          || (d.property && d.property.address.toLowerCase().indexOf(search) > -1);
    });
  }
  if (stage) filtered = filtered.filter(function(d) { return d.master_stage === stage; });
  if (finance) filtered = filtered.filter(function(d) { return d.finance_status === finance; });
  if (settlementWindow) {
    filtered = filtered.filter(function(d) {
      if (settlementWindow === 'settled') return d.action_required === 'Settled';
      const days = daysUntil(d.settlement_date);
      if (days == null) return false;
      return days >= 0 && days <= parseInt(settlementWindow, 10);
    });
  }

  renderResultCount(filtered.length, __deals.filter(function(d) {
    return view === 'firm' || d.broker_id === __broker.broker.id;
  }).length);
  renderTable(filtered, view);
}

function renderResultCount(shown, total) {
  document.getElementById('result-count').textContent =
    'Showing ' + shown + ' of ' + total + (total === 1 ? ' deal' : ' deals');
}

function renderTable(deals, view) {
  const tbody = document.getElementById('deals-tbody');
  const empty = document.getElementById('empty-state');
  tbody.textContent = '';

  if (deals.length === 0) {
    empty.style.display = 'block';
    empty.textContent = 'No deals match the current filters.';
    return;
  }
  empty.style.display = 'none';

  deals.forEach(function(d) {
    const tr = el('tr', {
      on: { click: function() { window.location.href = 'deal-detail.html?id=' + encodeURIComponent(d.id); } }
    });

    // Client
    const clientCell = el('td');
    clientCell.appendChild(el('div', {
      style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)' },
      text: d.client_name
    }));
    clientCell.appendChild(el('div', {
      className: 'muted',
      style: { fontSize: '0.78rem', marginTop: '0.15rem' },
      text: d.id + ' · ' + d.entity_type
    }));
    tr.appendChild(clientCell);

    // Stage
    const stageCell = el('td');
    stageCell.appendChild(badgeNode(d.master_stage, 'stage'));
    tr.appendChild(stageCell);

    // Property
    const propCell = el('td');
    if (d.property) {
      propCell.appendChild(el('div', {
        style: { fontWeight: '600', fontSize: '0.88rem' },
        text: d.property.address
      }));
      propCell.appendChild(el('div', {
        className: 'muted',
        style: { fontSize: '0.78rem', marginTop: '0.15rem' },
        text: d.property.type + ' · ' + formatAUD(d.property.purchase_price)
      }));
    } else {
      propCell.appendChild(el('span', { className: 'muted', text: 'Not allocated' }));
    }
    tr.appendChild(propCell);

    // Settlement date
    const settleCell = el('td');
    if (d.settlement_date) {
      const days = daysUntil(d.settlement_date);
      settleCell.appendChild(el('div', {
        style: { fontWeight: '600', fontSize: '0.88rem' },
        text: formatDate(d.settlement_date)
      }));
      if (days != null && days >= 0 && days <= 60) {
        settleCell.appendChild(el('div', {
          style: { fontSize: '0.75rem', color: 'var(--ac-gold)', marginTop: '0.15rem', fontWeight: '700' },
          text: days === 0 ? 'Today' : days + ' day' + (days === 1 ? '' : 's')
        }));
      } else if (days != null && days < 0) {
        settleCell.appendChild(el('div', {
          className: 'muted',
          style: { fontSize: '0.75rem', marginTop: '0.15rem' },
          text: 'Settled'
        }));
      }
    } else {
      settleCell.appendChild(el('span', { className: 'muted', text: '—' }));
    }
    tr.appendChild(settleCell);

    // Finance
    const finCell = el('td');
    finCell.appendChild(badgeNode(d.finance_status, 'finance'));
    tr.appendChild(finCell);

    // Updated
    tr.appendChild(el('td', {
      className: 'muted',
      style: { fontSize: '0.82rem' },
      text: formatRelative(d.last_updated)
    }));

    // Broker (only in firm view)
    const brokerCell = el('td');
    if (view !== 'firm') brokerCell.style.display = 'none';
    brokerCell.appendChild(el('div', {
      style: { fontSize: '0.85rem', fontWeight: '600' },
      text: d.broker_name
    }));
    tr.appendChild(brokerCell);

    // Arrow
    const arrowCell = el('td', { style: { textAlign: 'right', width: '40px' } });
    const arrow = iconNode('arrow', 'text-muted');
    arrow.setAttribute('class', (arrow.getAttribute('class') || '') + ' w-4 h-4');
    arrowCell.appendChild(arrow);
    tr.appendChild(arrowCell);

    tbody.appendChild(tr);
  });
}
