// Stock Pipeline — read-only card grid of upcoming property stock.

requireAuth();

let __stock = [];

document.addEventListener('DOMContentLoaded', async function () {
  try {
    __stock = await loadJSON('data/stock.json');
  } catch (e) {
    console.error('Failed to load stock', e);
    return;
  }

  ['stock-state', 'stock-type', 'stock-price', 'stock-status'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', renderGrid);
  });
  document.getElementById('stock-clear').addEventListener('click', function() {
    ['stock-state', 'stock-type', 'stock-price', 'stock-status'].forEach(function(id) {
      document.getElementById(id).value = '';
    });
    renderGrid();
  });

  renderGrid();
});

function renderGrid() {
  const state = document.getElementById('stock-state').value;
  const type = document.getElementById('stock-type').value;
  const price = document.getElementById('stock-price').value;
  const status = document.getElementById('stock-status').value;

  let filtered = __stock.slice();
  if (state) filtered = filtered.filter(function(s) { return s.state === state; });
  if (type) filtered = filtered.filter(function(s) { return s.type === type; });
  if (status) filtered = filtered.filter(function(s) { return s.stock_status === status; });
  if (price) {
    const parts = price.split('-').map(Number);
    filtered = filtered.filter(function(s) {
      return s.purchase_price >= parts[0] && s.purchase_price < parts[1];
    });
  }

  document.getElementById('stock-result-count').textContent =
    'Showing ' + filtered.length + ' of ' + __stock.length + ' properties';

  const grid = document.getElementById('stock-grid');
  const empty = document.getElementById('stock-empty');
  grid.textContent = '';

  if (filtered.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    empty.textContent = 'No stock matches the current filters.';
    return;
  }
  grid.style.display = 'grid';
  empty.style.display = 'none';

  filtered.forEach(function(s) { grid.appendChild(buildStockCard(s)); });
}

function buildStockCard(s) {
  const card = el('div', { className: 'stock-card' });

  const header = el('div', { className: 'stock-card-header' });
  header.appendChild(el('div', { className: 'stock-card-suburb', text: s.suburb }));
  header.appendChild(el('div', { className: 'stock-card-state', text: s.state + ' ' + s.postcode }));
  header.appendChild(el('div', { className: 'stock-card-price', text: formatAUDCompact(s.purchase_price) }));
  card.appendChild(header);

  const body = el('div', { className: 'stock-card-body' });
  body.appendChild(stockStat('Address', s.address));
  body.appendChild(stockStat('Type', s.type + (s.builder ? ' · ' + s.builder : '')));
  body.appendChild(stockStat('Bedrooms / Bathrooms / Cars', s.bedrooms + ' / ' + s.bathrooms + ' / ' + s.car_spaces));
  if (s.land_size_sqm) body.appendChild(stockStat('Land size', s.land_size_sqm + 'm²'));
  body.appendChild(stockStat('Est. rent', '$' + s.estimated_rent_pw + '/wk · ' + s.estimated_yield_pct + '% yield'));
  body.appendChild(stockStat('Settlement', formatDate(s.estimated_completion)));
  body.appendChild(stockStat('SMSF eligible', s.smsf_eligible ? 'Yes' : 'No'));
  card.appendChild(body);

  const footer = el('div', { className: 'stock-card-footer' });
  footer.appendChild(badgeNode(s.stock_status, 'stock'));
  footer.appendChild(el('button', {
    className: 'btn btn-outline btn-sm',
    text: 'Request brief',
    on: {
      click: function() {
        showToast('Brief requested for ' + s.suburb + ' — AllianceCorp will follow up within 1 business day', 'success');
      }
    }
  }));
  card.appendChild(footer);

  return card;
}

function stockStat(label, value) {
  const row = el('div', { className: 'stock-card-stat' });
  row.appendChild(el('span', { className: 'label', text: label }));
  row.appendChild(el('span', { className: 'value', text: String(value) }));
  return row;
}
