// Resources — gated content library card grid.

requireAuth();

const RESOURCE_ICON_MAP = {
  rates:     'finance',
  guide:     'resources',
  policy:    'documents',
  chart:     'activity',
  checklist: 'check'
};

document.addEventListener('DOMContentLoaded', async function () {
  let resources;
  try {
    resources = await loadJSON('data/resources.json');
  } catch (e) {
    console.error('Failed to load resources', e);
    return;
  }

  const grid = document.getElementById('resource-grid');
  resources.forEach(function(r) { grid.appendChild(buildResourceCard(r)); });
});

function buildResourceCard(r) {
  const card = el('div', {
    className: 'resource-card',
    on: { click: function() { showToast('Demo only — ' + r.title + ' would open here', 'info'); } }
  });

  const head = el('div', { className: 'flex items-start justify-between' });
  const iconBox = el('div', { className: 'resource-card-icon' });
  const ic = iconNode(RESOURCE_ICON_MAP[r.icon] || 'documents');
  ic.setAttribute('class', (ic.getAttribute('class') || '') + ' w-5 h-5');
  iconBox.appendChild(ic);
  head.appendChild(iconBox);
  head.appendChild(el('span', {
    className: 'eyebrow-grey',
    text: r.category,
    style: { fontSize: '0.65rem' }
  }));
  card.appendChild(head);

  card.appendChild(el('h3', {
    className: 'heading hd-3',
    style: { marginTop: '0.5rem' },
    text: r.title
  }));
  card.appendChild(el('p', {
    className: 'muted',
    style: { fontSize: '0.85rem', lineHeight: '1.55', flex: 1 },
    text: r.summary
  }));

  const footer = el('div', {
    className: 'flex items-center justify-between',
    style: { marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ac-border-soft)' }
  });
  footer.appendChild(el('span', {
    className: 'muted',
    style: { fontSize: '0.75rem' },
    text: r.format + ' · ' + r.size + ' · Updated ' + formatDate(r.updated)
  }));
  const dl = iconNode('download');
  dl.setAttribute('class', (dl.getAttribute('class') || '') + ' w-4 h-4');
  dl.style.color = 'var(--ac-navy)';
  footer.appendChild(dl);
  card.appendChild(footer);

  return card;
}
