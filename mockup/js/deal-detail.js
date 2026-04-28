// Deal Detail — six-tab view. Finance tab is the hero of the demo.
// Loads a single deal by ?id= query string and renders the active tab.

requireAuth();

let __deal = null;
let __broker = null;
let __valuations = {};
let __activity = [];
let __activeTab = 'overview';

document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get('id') || 'DEAL-2401';

  let allDeals;
  try {
    [__broker, allDeals, __valuations, __activity] = await Promise.all([
      loadJSON('data/broker.json'),
      loadJSON('data/deals.json'),
      loadJSON('data/valuations.json'),
      loadJSON('data/activity.json')
    ]);
  } catch (e) {
    console.error('Failed to load deal data', e);
    return;
  }
  __deal = allDeals.find(function(d) { return d.id === dealId; }) || allDeals[0];
  if (!__deal) {
    document.getElementById('deal-header').textContent = 'Deal not found.';
    return;
  }

  renderHeader();
  renderStageBarSection();
  renderTab(__activeTab);

  initTabs('#deal-tabs', function(tab) {
    __activeTab = tab;
    renderTab(tab);
  });
});

// --- Header -------------------------------------------------------------
function renderHeader() {
  const mount = document.getElementById('deal-header');
  mount.textContent = '';

  const wrap = el('div', {
    className: 'flex items-start justify-between',
    style: { flexWrap: 'wrap', gap: '1.5rem' }
  });

  const left = el('div');
  left.appendChild(el('div', { className: 'eyebrow', text: __deal.id + ' · ' + __deal.entity_type }));
  left.appendChild(el('h1', {
    className: 'hd-display heading',
    style: { marginTop: '0.4rem' },
    text: __deal.client_name
  }));
  const sub = __deal.property
    ? __deal.property.address + ' · ' + formatAUD(__deal.property.purchase_price)
    : 'No property allocated yet';
  left.appendChild(el('p', {
    className: 'muted',
    style: { marginTop: '0.5rem', fontSize: '0.95rem' },
    text: sub
  }));

  const right = el('div', {
    className: 'flex items-center gap-3',
    style: { flexWrap: 'wrap' }
  });
  right.appendChild(badgeNode(__deal.master_stage, 'stage'));
  right.appendChild(badgeNode(__deal.finance_status, 'finance'));
  if (__deal.action_required && __deal.action_required !== 'Settled') {
    right.appendChild(badgeNode(__deal.action_required, 'action'));
  }

  wrap.appendChild(left);
  wrap.appendChild(right);
  mount.appendChild(wrap);
}

// --- Stage bar ----------------------------------------------------------
function renderStageBarSection() {
  const mount = document.getElementById('stage-progress');
  mount.textContent = '';
  mount.appendChild(el('div', { className: 'eyebrow', text: 'Master Opp Stage', style: { marginBottom: '1rem' } }));
  mount.appendChild(renderStageBar(__deal.master_stage));
}

// --- Tab dispatcher -----------------------------------------------------
function renderTab(tab) {
  const mount = document.getElementById('tab-content');
  mount.textContent = '';
  switch (tab) {
    case 'finance':   mount.appendChild(renderFinanceTab()); break;
    case 'property':  mount.appendChild(renderPropertyTab()); break;
    case 'valuation': mount.appendChild(renderValuationTab()); break;
    case 'documents': mount.appendChild(renderDocumentsTab()); break;
    case 'activity':  mount.appendChild(renderActivityTab()); break;
    case 'overview':
    default:          mount.appendChild(renderOverviewTab()); break;
  }
}

// --- Overview tab -------------------------------------------------------
function renderOverviewTab() {
  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' } });

  // Client card
  const client = el('div', { className: 'card', style: { padding: '1.5rem' } });
  client.appendChild(el('div', { className: 'eyebrow', text: 'Client' }));
  client.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: __deal.client_name }));
  client.appendChild(twoColRow('Primary applicant', __deal.client_primary || '—'));
  if (__deal.client_secondary) {
    client.appendChild(twoColRow('Secondary applicant', __deal.client_secondary));
  }
  client.appendChild(twoColRow('Entity type', __deal.entity_type));
  client.appendChild(twoColRow('Master Opp ID', __deal.id));
  client.appendChild(twoColRow('Broker', __deal.broker_name));
  grid.appendChild(client);

  // Property summary card
  const prop = el('div', { className: 'card', style: { padding: '1.5rem' } });
  prop.appendChild(el('div', { className: 'eyebrow', text: 'Property' }));
  if (__deal.property) {
    prop.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: __deal.property.address }));
    prop.appendChild(twoColRow('Type', __deal.property.type));
    prop.appendChild(twoColRow('Purchase price', formatAUD(__deal.property.purchase_price)));
    prop.appendChild(twoColRow('Builder', __deal.property.builder));
    prop.appendChild(twoColRow('Estimated rent', '$' + __deal.property.estimated_rent_pw + '/wk · ' + __deal.property.estimated_yield_pct + '% yield'));
    prop.appendChild(twoColRow('Settlement target', formatDate(__deal.property.estimated_settlement)));
  } else {
    prop.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: 'No property allocated' }));
    prop.appendChild(el('p', { className: 'muted', text: 'AllianceCorp will allocate Property Stock once the strategy and PP sessions are complete.' }));
  }
  grid.appendChild(prop);

  // Key dates
  const dates = el('div', { className: 'card', style: { padding: '1.5rem' } });
  dates.appendChild(el('div', { className: 'eyebrow', text: 'Key Dates' }));
  dates.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: 'Timeline' }));
  dates.appendChild(twoColRow('Last updated', formatRelative(__deal.last_updated)));
  if (__deal.finance.final_approval_date) {
    dates.appendChild(twoColRow('Final approval received', formatDate(__deal.finance.final_approval_date)));
  }
  if (__deal.settlement_date) {
    const days = daysUntil(__deal.settlement_date);
    let when = formatDate(__deal.settlement_date);
    if (days != null && days >= 0) when += ' (' + (days === 0 ? 'today' : days + ' day' + (days === 1 ? '' : 's')) + ')';
    dates.appendChild(twoColRow('Settlement date', when));
  }
  grid.appendChild(dates);

  // Finance summary
  const fin = el('div', { className: 'card', style: { padding: '1.5rem' } });
  fin.appendChild(el('div', { className: 'eyebrow', text: 'Finance Snapshot' }));
  fin.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: __deal.finance.lender || 'Lender TBA' }));
  fin.appendChild(twoColRow('Pre-approval', __deal.finance.pre_approval_status + (__deal.finance.pre_approval_amount ? ' · ' + formatAUD(__deal.finance.pre_approval_amount) : '')));
  fin.appendChild(twoColRow('Final approval', __deal.finance.final_approval_status));
  if (__deal.finance.interest_rate) {
    fin.appendChild(twoColRow('Rate', __deal.finance.interest_rate + '% · ' + __deal.finance.loan_type));
  }
  const cta = el('a', {
    attrs: { href: '#' },
    className: 'btn btn-primary btn-sm',
    style: { marginTop: '1rem', display: 'inline-flex' },
    text: 'Open Finance tab',
    on: { click: function(e) { e.preventDefault(); document.querySelector('[data-tab="finance"]').click(); } }
  });
  fin.appendChild(cta);
  grid.appendChild(fin);

  return grid;
}

function twoColRow(label, value) {
  const row = el('div', {
    className: 'flex justify-between',
    style: { padding: '0.65rem 0', borderBottom: '1px solid var(--ac-border-soft)', fontSize: '0.88rem' }
  });
  row.appendChild(el('span', { className: 'eyebrow-grey', text: label, style: { letterSpacing: '1.4px' } }));
  row.appendChild(el('span', { style: { fontWeight: '600', color: 'var(--ac-secondary)', textAlign: 'right' }, text: value || '—' }));
  return row;
}

// --- Finance tab (HERO) -------------------------------------------------
function renderFinanceTab() {
  const wrap = el('div', { style: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' } });

  // Form card
  const form = el('div', { className: 'card', style: { padding: '2rem' } });
  form.appendChild(el('div', { className: 'eyebrow', text: 'Update finance fields' }));
  form.appendChild(el('h2', {
    className: 'heading hd-2',
    style: { marginTop: '0.4rem', marginBottom: '0.4rem' },
    text: 'Finance — ' + __deal.client_name
  }));
  form.appendChild(el('p', {
    className: 'muted',
    style: { marginBottom: '1.5rem', fontSize: '0.88rem' },
    text: 'Updates here write straight back to the Master Opp deal in AllianceCorp\'s CRM. Your changes are visible to the AllianceCorp Settlement and Acquisitions teams in real time.'
  }));

  const f = __deal.finance;
  const formEl = el('form', { attrs: { id: 'finance-form' } });

  formEl.appendChild(fieldRow([
    selectField('pre_approval_status', 'Pre-approval status',
      ['Not Started', 'In Assessment', 'Received', 'Declined', 'Settled'], f.pre_approval_status),
    numberField('pre_approval_amount', 'Pre-approval amount (AUD)', f.pre_approval_amount)
  ]));
  formEl.appendChild(fieldRow([
    inputField('lender', 'Lender', f.lender),
    numberField('interest_rate', 'Interest rate (%)', f.interest_rate, '0.01')
  ]));
  formEl.appendChild(fieldRow([
    selectField('loan_type', 'Loan type',
      ['Principal & Interest — Investment', 'Interest Only — Investment', 'Limited Recourse — SMSF', 'Other'], f.loan_type),
    numberField('loan_term_years', 'Loan term (years)', f.loan_term_years)
  ]));
  formEl.appendChild(fieldRow([
    selectField('final_approval_status', 'Final approval status',
      ['Not Started', 'Submitted', 'Approved', 'Declined', 'Settled'], f.final_approval_status),
    dateField('final_approval_date', 'Final approval date', f.final_approval_date)
  ]));

  // Notes (full width)
  const notesWrap = el('div', { style: { marginBottom: '1.25rem' } });
  notesWrap.appendChild(el('label', { className: 'field-label', attrs: { for: 'notes' }, text: 'Broker notes' }));
  const ta = el('textarea', { className: 'textarea', attrs: { id: 'notes', name: 'notes', rows: '4' }, text: f.notes || '' });
  notesWrap.appendChild(ta);
  notesWrap.appendChild(el('div', { className: 'field-help', text: 'Visible to AllianceCorp Settlement & Acquisitions teams.' }));
  formEl.appendChild(notesWrap);

  // Save bar
  const saveBar = el('div', {
    className: 'flex items-center justify-between',
    style: { paddingTop: '1.25rem', borderTop: '1px solid var(--ac-border)' }
  });
  saveBar.appendChild(el('div', {
    className: 'muted',
    style: { fontSize: '0.78rem' },
    text: 'Last synced ' + formatRelative(__deal.last_updated)
  }));
  const btnGroup = el('div', { className: 'flex gap-3' });
  btnGroup.appendChild(el('button', { attrs: { type: 'reset' }, className: 'btn btn-ghost', text: 'Discard' }));
  btnGroup.appendChild(el('button', { attrs: { type: 'submit' }, className: 'btn btn-primary', text: 'Save changes' }));
  saveBar.appendChild(btnGroup);
  formEl.appendChild(saveBar);

  formEl.addEventListener('submit', function(e) {
    e.preventDefault();
    // Mock the save — read values back into the deal so subsequent renders reflect changes.
    const data = new FormData(formEl);
    Object.assign(__deal.finance, {
      pre_approval_status: data.get('pre_approval_status'),
      pre_approval_amount: data.get('pre_approval_amount') ? Number(data.get('pre_approval_amount')) : null,
      lender: data.get('lender') || null,
      interest_rate: data.get('interest_rate') ? Number(data.get('interest_rate')) : null,
      loan_type: data.get('loan_type'),
      loan_term_years: data.get('loan_term_years') ? Number(data.get('loan_term_years')) : null,
      final_approval_status: data.get('final_approval_status'),
      final_approval_date: data.get('final_approval_date') || null,
      notes: data.get('notes')
    });
    __deal.last_updated = new Date().toISOString();
    showToast('Finance updates saved — synced to AllianceCorp CRM', 'success');
    renderHeader();
  });

  form.appendChild(formEl);
  wrap.appendChild(form);

  // Side rail — sync indicator + lender info
  const rail = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' } });

  const syncCard = el('div', { className: 'card', style: { padding: '1.5rem' } });
  syncCard.appendChild(el('div', { className: 'eyebrow', text: 'How this saves' }));
  syncCard.appendChild(el('h3', {
    className: 'heading hd-3',
    style: { marginTop: '0.4rem', marginBottom: '0.5rem' },
    text: 'Direct sync to Master Opp'
  }));
  syncCard.appendChild(el('p', {
    className: 'muted',
    style: { fontSize: '0.85rem', lineHeight: '1.55' },
    text: 'Changes write directly to the Master Opp deal in HubSpot. AllianceCorp\'s Acquisitions, Settlement and Mortgage Broking teams see the same record — no double entry.'
  }));
  const stepList = el('ul', { style: { marginTop: '1rem', paddingLeft: '0', listStyle: 'none' } });
  ['Master Opp deal', 'Mortgage Broking pipeline', 'Settlement Opp (when spawned)'].forEach(function(item, i) {
    const li = el('li', {
      className: 'flex items-center gap-2',
      style: { padding: '0.45rem 0', fontSize: '0.85rem', color: 'var(--ac-secondary)' }
    });
    const icon = iconNode('check');
    icon.setAttribute('class', (icon.getAttribute('class') || '') + ' w-4 h-4');
    icon.style.color = 'var(--ac-green)';
    li.appendChild(icon);
    li.appendChild(el('span', { text: item }));
    stepList.appendChild(li);
  });
  syncCard.appendChild(stepList);
  rail.appendChild(syncCard);

  // Lender chase shortcut
  const chaseCard = el('div', { className: 'card', style: { padding: '1.5rem' } });
  chaseCard.appendChild(el('div', { className: 'eyebrow', text: 'Quick actions' }));
  chaseCard.appendChild(el('h3', { className: 'heading hd-3', style: { marginTop: '0.4rem', marginBottom: '1rem' }, text: 'Need to chase?' }));
  ['Email AllianceCorp settlements', 'Request updated valuation', 'Upload supporting documents'].forEach(function(label) {
    const a = el('a', {
      attrs: { href: '#' },
      className: 'flex items-center justify-between',
      style: { padding: '0.65rem 0', borderBottom: '1px solid var(--ac-border-soft)', fontSize: '0.88rem', color: 'var(--ac-navy)' },
      on: { click: function(e) { e.preventDefault(); showToast(label + ' — coming soon in production build', 'info'); } }
    });
    a.appendChild(el('span', { text: label, style: { fontFamily: 'var(--font-heading)', fontWeight: '600' } }));
    const arrow = iconNode('arrow', 'text-muted');
    arrow.setAttribute('class', (arrow.getAttribute('class') || '') + ' w-4 h-4');
    a.appendChild(arrow);
    chaseCard.appendChild(a);
  });
  rail.appendChild(chaseCard);

  wrap.appendChild(rail);
  return wrap;
}

// Form helpers
function fieldRow(fields) {
  return el('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', marginBottom: '1rem' },
    children: fields
  });
}
function inputField(name, label, value, type) {
  type = type || 'text';
  const wrap = el('div');
  wrap.appendChild(el('label', { className: 'field-label', attrs: { for: name }, text: label }));
  wrap.appendChild(el('input', {
    className: 'input',
    attrs: { id: name, name: name, type: type, value: value == null ? '' : String(value) }
  }));
  return wrap;
}
function numberField(name, label, value, step) {
  const wrap = el('div');
  wrap.appendChild(el('label', { className: 'field-label', attrs: { for: name }, text: label }));
  wrap.appendChild(el('input', {
    className: 'input',
    attrs: { id: name, name: name, type: 'number', step: step || '1', value: value == null ? '' : String(value) }
  }));
  return wrap;
}
function dateField(name, label, value) {
  const wrap = el('div');
  wrap.appendChild(el('label', { className: 'field-label', attrs: { for: name }, text: label }));
  wrap.appendChild(el('input', {
    className: 'input',
    attrs: { id: name, name: name, type: 'date', value: value || '' }
  }));
  return wrap;
}
function selectField(name, label, options, current) {
  const wrap = el('div');
  wrap.appendChild(el('label', { className: 'field-label', attrs: { for: name }, text: label }));
  const sel = el('select', { className: 'select', attrs: { id: name, name: name } });
  options.forEach(function(opt) {
    const o = el('option', { attrs: { value: opt }, text: opt });
    if (opt === current) o.setAttribute('selected', 'selected');
    sel.appendChild(o);
  });
  wrap.appendChild(sel);
  return wrap;
}

// --- Property tab -------------------------------------------------------
function renderPropertyTab() {
  if (!__deal.property) {
    return el('div', {
      className: 'card',
      style: { padding: '3rem', textAlign: 'center' },
      children: [
        el('h2', { className: 'heading hd-2', text: 'No property allocated yet' }),
        el('p', { className: 'muted', style: { marginTop: '1rem' }, text: 'AllianceCorp will allocate Property Stock once strategy + PP are complete.' })
      ]
    });
  }
  const p = __deal.property;
  const card = el('div', { className: 'card', style: { padding: '2rem' } });
  card.appendChild(el('div', { className: 'eyebrow', text: 'Allocated Property Stock' }));
  card.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '0.5rem' }, text: p.address }));
  card.appendChild(el('p', { className: 'muted', style: { fontSize: '0.95rem', marginBottom: '1.5rem' }, text: p.type + ' · Built by ' + p.builder }));

  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' } });
  [
    { label: 'Bedrooms', value: p.bedrooms },
    { label: 'Bathrooms', value: p.bathrooms },
    { label: 'Car spaces', value: p.car_spaces },
    { label: 'Land size', value: p.land_size_sqm ? p.land_size_sqm + 'm²' : '—' }
  ].forEach(function(s) {
    const stat = el('div', { className: 'card', style: { padding: '1rem 1.25rem' } });
    stat.appendChild(el('div', { className: 'eyebrow-grey', text: s.label }));
    stat.appendChild(el('div', {
      style: { fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--ac-navy)', marginTop: '0.4rem' },
      text: String(s.value || '—')
    }));
    grid.appendChild(stat);
  });
  card.appendChild(grid);

  const numeric = el('div');
  numeric.appendChild(twoColRow('Purchase price', formatAUD(p.purchase_price)));
  numeric.appendChild(twoColRow('Estimated rent', '$' + p.estimated_rent_pw + '/wk'));
  numeric.appendChild(twoColRow('Estimated yield', p.estimated_yield_pct + '%'));
  numeric.appendChild(twoColRow('Settlement target', formatDate(p.estimated_settlement)));
  card.appendChild(numeric);

  card.appendChild(el('div', {
    style: { marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(208,161,23,0.07)', borderLeft: '3px solid var(--ac-gold)', fontSize: '0.85rem', color: 'var(--ac-secondary)' },
    text: 'Property Stock data is read-only here — managed by AllianceCorp\'s Acquisitions team. To update, contact Peter Shahin.'
  }));
  return card;
}

// --- Valuation tab ------------------------------------------------------
function renderValuationTab() {
  const card = el('div', { className: 'card', style: { padding: '2rem' } });
  const head = el('div', { className: 'flex items-start justify-between', style: { marginBottom: '1.5rem' } });
  const title = el('div');
  title.appendChild(el('div', { className: 'eyebrow', text: 'Valuations' }));
  title.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem' }, text: 'Linked valuation records' }));
  head.appendChild(title);
  head.appendChild(el('button', {
    className: 'btn btn-gold btn-sm',
    text: '+ Request valuation',
    on: { click: function() { showToast('Valuation request sent to AllianceCorp acquisitions team', 'success'); } }
  }));
  card.appendChild(head);

  const linked = (__deal.valuations || []).map(function(id) { return __valuations[id]; }).filter(Boolean);
  if (linked.length === 0) {
    card.appendChild(el('p', { className: 'muted', style: { padding: '2rem 0', textAlign: 'center' }, text: 'No valuations linked to this deal.' }));
    return card;
  }

  const table = el('table', { className: 'table' });
  const thead = el('thead');
  const tr = el('tr');
  ['Date', 'Valuer', 'Method', 'Purpose', 'Amount', 'Status'].forEach(function(h) {
    tr.appendChild(el('th', { text: h }));
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = el('tbody');
  linked.forEach(function(v) {
    const row = el('tr');
    row.appendChild(el('td', { text: formatDate(v.valuation_date) }));
    row.appendChild(el('td', { text: v.valuer, style: { fontWeight: '600' } }));
    row.appendChild(el('td', { text: v.method }));
    row.appendChild(el('td', { text: v.purpose }));
    row.appendChild(el('td', { text: v.amount ? formatAUD(v.amount) : '—', style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)' } }));
    const statusCell = el('td');
    statusCell.appendChild(badgeNode(v.status, v.status === 'Completed' ? 'stock' : 'finance'));
    row.appendChild(statusCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

// --- Documents tab ------------------------------------------------------
function renderDocumentsTab() {
  const card = el('div', { className: 'card', style: { padding: '2rem' } });
  card.appendChild(el('div', { className: 'eyebrow', text: 'Documents' }));
  card.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1.25rem' }, text: 'Files attached to this deal' }));

  const docs = __deal.documents || [];
  if (docs.length > 0) {
    docs.forEach(function(doc, i) {
      const row = el('div', {
        className: 'flex items-center justify-between',
        style: { padding: '1rem 0', borderBottom: i < docs.length - 1 ? '1px solid var(--ac-border-soft)' : 'none' }
      });
      const left = el('div', { className: 'flex items-center gap-3' });
      const iconBox = el('div', {
        className: 'flex items-center justify-center',
        style: { width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(3,38,125,0.08)', color: 'var(--ac-navy)' }
      });
      const ic = iconNode('pdf');
      ic.setAttribute('class', (ic.getAttribute('class') || '') + ' w-5 h-5');
      iconBox.appendChild(ic);
      left.appendChild(iconBox);
      const body = el('div');
      body.appendChild(el('div', { style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)', fontSize: '0.92rem' }, text: doc.name }));
      body.appendChild(el('div', { className: 'muted', style: { fontSize: '0.78rem', marginTop: '0.2rem' }, text: 'Uploaded ' + formatDate(doc.uploaded) + ' · ' + doc.size }));
      left.appendChild(body);
      row.appendChild(left);
      row.appendChild(el('button', {
        className: 'btn btn-ghost btn-sm',
        text: 'Download',
        on: { click: function() { showToast('Demo only — file would download in production', 'info'); } }
      }));
      card.appendChild(row);
    });
  } else {
    card.appendChild(el('p', { className: 'muted', style: { padding: '1rem 0' }, text: 'No documents attached yet.' }));
  }

  // Upload area
  const upload = el('div', {
    style: {
      marginTop: '1.5rem',
      padding: '2.5rem',
      border: '2px dashed var(--ac-border)',
      borderRadius: '4px',
      textAlign: 'center',
      cursor: 'pointer'
    },
    on: { click: function() { showToast('File picker would open in production', 'info'); } }
  });
  const upIcon = iconNode('upload');
  upIcon.setAttribute('class', (upIcon.getAttribute('class') || '') + ' w-6 h-6');
  upIcon.style.color = 'var(--ac-navy)';
  upIcon.style.margin = '0 auto 0.6rem';
  upload.appendChild(upIcon);
  upload.appendChild(el('div', { style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)' }, text: 'Drop a file or click to upload' }));
  upload.appendChild(el('div', { className: 'muted', style: { fontSize: '0.8rem', marginTop: '0.3rem' }, text: 'PDF, image, or Word — up to 25MB' }));
  card.appendChild(upload);

  return card;
}

// --- Activity tab -------------------------------------------------------
function renderActivityTab() {
  const card = el('div', { className: 'card', style: { padding: '2rem' } });
  card.appendChild(el('div', { className: 'eyebrow', text: 'Activity' }));
  card.appendChild(el('h2', { className: 'heading hd-2', style: { marginTop: '0.4rem', marginBottom: '1.25rem' }, text: 'Recent activity on this deal' }));

  // Filter activity to this deal, plus invent some plausible context entries.
  const dealActivity = __activity.filter(function(a) { return a.deal_id === __deal.id; });
  const synthetic = [
    { title: 'Deal updated', detail: 'Master Opp moved to ' + __deal.master_stage, timestamp: __deal.last_updated, actor: __deal.broker_name, type: 'finance_update' },
    { title: 'Linked to broker', detail: __deal.broker_name + ' (' + __broker.firm.name + ') assigned as broker of record.', timestamp: '2026-02-12T10:00:00', actor: 'AllianceCorp', type: 'finance_update' }
  ];
  const items = dealActivity.concat(synthetic).sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });

  items.forEach(function(item, idx) {
    const row = el('div', { className: 'activity-row' });
    row.appendChild(el('div', { className: 'activity-dot' }));
    const body = el('div', { style: { flex: 1 } });
    body.appendChild(el('div', { style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)', fontSize: '0.92rem' }, text: item.title }));
    body.appendChild(el('div', { className: 'muted', style: { fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.5' }, text: item.detail }));
    body.appendChild(el('div', {
      className: 'muted',
      style: { fontSize: '0.72rem', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '1.2px' },
      text: formatRelative(item.timestamp) + ' · ' + item.actor
    }));
    row.appendChild(body);
    card.appendChild(row);
  });
  return card;
}
