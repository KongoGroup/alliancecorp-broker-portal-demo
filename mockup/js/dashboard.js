// Dashboard — broker home view
// All data from local JSON. Honours the My Deals / Firm View toggle.

requireAuth();

document.addEventListener('DOMContentLoaded', async function () {
  let broker, deals, activity;
  try {
    [broker, deals, activity] = await Promise.all([
      loadJSON('data/broker.json'),
      loadJSON('data/deals.json'),
      loadJSON('data/activity.json')
    ]);
  } catch (e) {
    console.error('Failed to load dashboard data', e);
    return;
  }

  function renderAll() {
    const view = getView();
    const visibleDeals = view === 'firm'
      ? deals
      : deals.filter(function(d) { return d.broker_id === broker.broker.id; });
    const visibleActivity = view === 'firm'
      ? activity
      : activity.filter(function(a) { return a.broker_id === broker.broker.id; });

    renderWelcome(broker, view);
    renderKPIs(visibleDeals, view);
    renderAttention(visibleDeals);
    renderActivity(visibleActivity);
  }

  renderAll();
  document.addEventListener('viewchange', renderAll);
});

// --- Welcome strip ------------------------------------------------------
function renderWelcome(broker, view) {
  const mount = document.getElementById('welcome-strip');
  if (!mount) return;
  mount.textContent = '';

  const greeting = greetingForNow();

  const wrap = el('div', {
    className: 'flex items-center justify-between',
    style: { flexWrap: 'wrap', gap: '1.5rem' }
  });

  const left = el('div');
  left.appendChild(el('div', { className: 'eyebrow', text: greeting + ' — ' + formatDate(new Date().toISOString().slice(0, 10)) }));
  left.appendChild(el('h1', {
    className: 'hd-display heading',
    style: { marginTop: '0.4rem' },
    text: greeting + ', ' + broker.broker.first_name
  }));
  left.appendChild(el('p', {
    className: 'muted',
    style: { marginTop: '0.5rem', fontSize: '0.95rem', maxWidth: '640px' },
    text: view === 'firm'
      ? 'You are viewing all active deals across ' + broker.firm.name + '. Toggle to "My Deals" for your own pipeline only.'
      : 'Here is your AllianceCorp pipeline. Toggle to "Firm View" to see ' + broker.firm.name + '’s wider book.'
  }));

  // CSM card on the right
  const csm = el('div', {
    className: 'card flex items-center gap-4',
    style: { padding: '1rem 1.5rem', minWidth: '280px' }
  });
  csm.appendChild(el('div', {
    className: 'flex items-center justify-center',
    style: {
      width: '46px', height: '46px', borderRadius: '50%',
      background: 'var(--ac-gold)', color: 'white',
      fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '0.85rem'
    },
    text: broker.ac_csm.initials
  }));
  const csmInfo = el('div');
  csmInfo.appendChild(el('div', {
    className: 'eyebrow-grey', text: 'Your AllianceCorp Contact'
  }));
  csmInfo.appendChild(el('div', {
    style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)', fontSize: '0.95rem', marginTop: '0.2rem' },
    text: broker.ac_csm.name
  }));
  csmInfo.appendChild(el('div', {
    style: { fontSize: '0.78rem', color: 'var(--ac-text)' },
    text: broker.ac_csm.title + ' · ' + broker.ac_csm.phone
  }));
  csm.appendChild(csmInfo);

  wrap.appendChild(left);
  wrap.appendChild(csm);
  mount.appendChild(wrap);
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// --- KPI tiles ----------------------------------------------------------
function renderKPIs(visibleDeals, view) {
  const mount = document.getElementById('kpi-tiles');
  if (!mount) return;
  mount.textContent = '';

  const active = visibleDeals.filter(function(d) {
    return d.master_stage !== 'Settlement' || (d.master_stage === 'Settlement' && d.action_required !== 'Settled');
  }).length;
  const pendingFinance = visibleDeals.filter(function(d) {
    return d.finance_status === 'Pre-Approval Pending'
        || d.finance_status === 'Awaiting Final Approval';
  }).length;
  const settledThisQuarter = visibleDeals.filter(function(d) {
    if (!d.settlement_date) return false;
    const dt = new Date(d.settlement_date + 'T00:00:00');
    const today = new Date();
    const qStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    return dt >= qStart && d.action_required === 'Settled';
  }).length;
  // Mock commission — flat estimate per settled/imminent deal
  const commissionYTD = visibleDeals.reduce(function(sum, d) {
    if (d.action_required === 'Settled' || d.action_required === 'Settlement imminent') {
      return sum + (d.property ? Math.round(d.property.purchase_price * 0.0066) : 0);
    }
    return sum;
  }, 0);

  const tiles = [
    { label: 'Active Deals',    value: String(active),
      sub: view === 'firm' ? 'across ' + visibleDeals.length + ' deals firm-wide' : 'in your pipeline',
      accent: 'var(--ac-navy)', icon: 'deals' },
    { label: 'Pending Finance', value: String(pendingFinance),
      sub: 'awaiting pre-approval or final',
      accent: 'var(--ac-gold)', icon: 'finance' },
    { label: 'Settling This Quarter', value: String(settledThisQuarter + visibleDeals.filter(function(d){return d.action_required==='Settlement imminent';}).length),
      sub: 'including imminent',
      accent: 'var(--ac-green)', icon: 'check' },
    { label: 'Est. Commission YTD', value: formatAUDCompact(commissionYTD),
      sub: 'based on 0.66% upfront',
      accent: 'var(--ac-light-blue)', icon: 'finance' }
  ];

  tiles.forEach(function(t) {
    const card = el('div', { className: 'kpi-card' });
    card.style.borderTopColor = t.accent;

    const top = el('div', {
      className: 'flex items-center justify-between',
      style: { marginBottom: '1rem' }
    });
    top.appendChild(el('span', {
      className: 'eyebrow-grey',
      text: t.label
    }));
    const iconBox = el('div', {
      className: 'flex items-center justify-center',
      style: {
        width: '36px', height: '36px', borderRadius: '4px',
        background: t.accent, color: 'white'
      }
    });
    const ic = iconNode(t.icon);
    ic.setAttribute('class', (ic.getAttribute('class') || '') + ' w-4 h-4');
    iconBox.appendChild(ic);
    top.appendChild(iconBox);
    card.appendChild(top);

    card.appendChild(el('div', {
      style: {
        fontFamily: 'var(--font-heading)',
        fontSize: '2.1rem',
        color: 'var(--ac-navy)',
        lineHeight: '1.05',
        marginBottom: '0.4rem'
      },
      text: t.value
    }));
    card.appendChild(el('p', {
      className: 'muted',
      style: { fontSize: '0.78rem' },
      text: t.sub
    }));
    mount.appendChild(card);
  });
}

// --- Deals needing attention -------------------------------------------
function renderAttention(visibleDeals) {
  const mount = document.getElementById('attention-list');
  if (!mount) return;
  mount.textContent = '';

  const card = el('div', { className: 'card', style: { padding: '1.5rem' } });
  card.appendChild(el('div', {
    className: 'flex items-center justify-between',
    style: { marginBottom: '1.25rem' },
    children: [
      el('div', {
        children: [
          el('div', { className: 'eyebrow', text: 'Action required' }),
          el('h2', {
            className: 'heading hd-2',
            style: { marginTop: '0.3rem' },
            text: 'Deals needing your attention'
          })
        ]
      }),
      el('a', {
        attrs: { href: 'deals.html' },
        className: 'muted',
        style: { fontSize: '0.85rem', fontWeight: '600' },
        text: 'View all →'
      })
    ]
  }));

  const flagged = visibleDeals
    .filter(function(d) {
      return d.action_required && d.action_required !== 'Settled';
    })
    .sort(function(a, b) {
      // Prioritise settlement-imminent and awaiting-final-approval at top
      const order = ['Settlement imminent', 'Awaiting final approval', 'Awaiting valuation', 'Awaiting pre-approval', 'Awaiting EOI', 'Awaiting EOI decision'];
      const ai = order.indexOf(a.action_required);
      const bi = order.indexOf(b.action_required);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 5);

  if (flagged.length === 0) {
    card.appendChild(el('p', {
      className: 'muted',
      style: { padding: '1.5rem 0', textAlign: 'center' },
      text: 'Nothing flagged right now. Your pipeline is clean.'
    }));
    mount.appendChild(card);
    return;
  }

  flagged.forEach(function(d, idx) {
    const row = el('a', {
      attrs: { href: 'deal-detail.html?id=' + encodeURIComponent(d.id) },
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 0',
        borderBottom: idx < flagged.length - 1 ? '1px solid var(--ac-border-soft)' : 'none',
        color: 'inherit'
      }
    });

    const left = el('div');
    left.appendChild(el('div', {
      style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)', fontSize: '0.95rem' },
      text: d.client_name + ' · ' + d.id
    }));
    const sub = el('div', {
      className: 'muted',
      style: { fontSize: '0.8rem', marginTop: '0.25rem' },
      text: (d.property ? d.property.address : 'No property allocated yet')
            + ' · last updated ' + formatRelative(d.last_updated)
    });
    left.appendChild(sub);

    const right = el('div', {
      className: 'flex items-center gap-3',
      style: { flexShrink: 0 }
    });
    right.appendChild(badgeNode(d.action_required, 'action'));
    const arrow = iconNode('arrow', 'text-muted');
    arrow.setAttribute('class', (arrow.getAttribute('class') || '') + ' w-4 h-4');
    right.appendChild(arrow);

    row.appendChild(left);
    row.appendChild(right);
    card.appendChild(row);
  });

  mount.appendChild(card);
}

// --- Activity feed ------------------------------------------------------
function renderActivity(visibleActivity) {
  const mount = document.getElementById('activity-feed');
  if (!mount) return;
  mount.textContent = '';

  const card = el('div', { className: 'card', style: { padding: '1.5rem' } });
  card.appendChild(el('div', {
    style: { marginBottom: '1.25rem' },
    children: [
      el('div', { className: 'eyebrow', text: 'Pipeline updates' }),
      el('h2', {
        className: 'heading hd-2',
        style: { marginTop: '0.3rem' },
        text: 'Recent activity'
      })
    ]
  }));

  const recent = visibleActivity
    .slice()
    .sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); })
    .slice(0, 6);

  if (recent.length === 0) {
    card.appendChild(el('p', {
      className: 'muted',
      style: { padding: '1.5rem 0', textAlign: 'center' },
      text: 'No recent activity.'
    }));
    mount.appendChild(card);
    return;
  }

  const dotColours = {
    settlement: 'var(--ac-green)',
    finance_update: 'var(--ac-navy)',
    stock_allocation: 'var(--ac-gold)',
    valuation: 'var(--ac-light-blue)',
    compliance: 'var(--ac-danger)'
  };

  recent.forEach(function(a) {
    const row = el('div', { className: 'activity-row' });
    const dot = el('div', { className: 'activity-dot' });
    dot.style.background = dotColours[a.type] || 'var(--ac-navy)';
    row.appendChild(dot);

    const body = el('div', { style: { flex: 1, minWidth: 0 } });
    body.appendChild(el('div', {
      style: { fontFamily: 'var(--font-heading)', color: 'var(--ac-navy)', fontSize: '0.9rem' },
      text: a.title
    }));
    body.appendChild(el('div', {
      className: 'muted',
      style: { fontSize: '0.83rem', marginTop: '0.25rem', lineHeight: '1.45' },
      text: a.detail
    }));
    body.appendChild(el('div', {
      className: 'muted',
      style: { fontSize: '0.72rem', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '1.2px' },
      text: formatRelative(a.timestamp) + ' · ' + a.actor
    }));
    row.appendChild(body);
    card.appendChild(row);
  });

  mount.appendChild(card);
}
