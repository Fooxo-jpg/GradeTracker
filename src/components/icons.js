const paths = {
  overview: '<rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/>',
  courses: '<path d="M12 6.5C9.5 4.5 6 4 3.5 5v14c3-1 6-.5 8.5 1.5 2.5-2 5.5-2.5 8.5-1.5V5c-2.5-1-6-.5-8.5 1.5Zm0 0v14"/>',
  grades: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="m7.5 14 3-3 3 2 3-5M8 17h8"/>',
  settings: '<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  percent: '<path d="m7 17 10-10"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  edit: '<path d="m14.5 5.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11Z"/>',
  copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="3"/><path d="M15.5 8V6.5a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3H8"/>',
  trash: '<path d="M4.5 7h15M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6 7l.7 11a2.5 2.5 0 0 0 2.5 2.5h5.6a2.5 2.5 0 0 0 2.5-2.5L18 7M10 11v5M14 11v5"/>',
  close: '<path d="m7 7 10 10M7 17 17 7"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  trend: '<path d="M4 17.5 9 12l4 3 7-9M14.5 6H20v5.5"/>',
  units: '<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 3.5v17M12.5 8H16M12.5 12H16M12.5 16H15"/>',
  target: '<circle cx="11" cy="13" r="7.5"/><circle cx="11" cy="13" r="3.5"/><path d="m11 13 9-9M16 4h4v4"/>',
  sync: '<path d="M19.5 9a7.5 7.5 0 0 0-13-2L4 9m0-5v5h5M4.5 15a7.5 7.5 0 0 0 13 2l2.5-2m0 5v-5h-5"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  palette: '<path d="M21 12a9 9 0 1 0-9 9h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h4a2 2 0 0 0 2-1Z"/><path d="M7 10h.01M10 6h.01M15 7h.01"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  left: '<path d="m14 7-5 5 5 5"/>',
  right: '<path d="m10 7 5 5-5 5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>'
};

export function uiIcon(name) {
  const background = ['overview','grades','units','calendar','copy'].includes(name) ? '<rect x="4" y="5" width="16" height="15" rx="3" fill="currentColor" opacity=".07" stroke="none"/>' : '';
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${background}${paths[name] || paths.info}</svg>`;
}

export function normalizeIcons(root) {
  root.querySelectorAll('[data-page]').forEach(button => {
    const name = button.dataset.page.toLowerCase();
    const svg = button.querySelector('svg');
    if (svg) svg.outerHTML = uiIcon(name === 'terms' ? 'calendar' : name);
  });
  root.querySelectorAll('.calendar-heading-icon').forEach(element => { element.innerHTML = uiIcon('calendar'); });
  root.querySelectorAll('.settings-heading>span').forEach(element => { if (element.textContent.trim() === '％') element.innerHTML = uiIcon('percent'); });
  root.querySelectorAll('#delete-course-dialog svg,#delete-term-dialog svg').forEach(svg => { svg.outerHTML = uiIcon('trash'); });
  const glyphs = { '✎':'edit','⧉':'copy','×':'close','＋':'plus','+':'plus','✓':'check','⌕':'search','↗':'trend','◇':'units','◎':'target','↻':'sync','♙':'user','ⓘ':'info','◐':'palette','•••':'more','›':'right','‹':'left','→':'arrow','▦':'calendar' };
  root.querySelectorAll('button,.settings-heading>span,.stat-icon,.goal-icon,.brand-mark,.course-search>span,.profile>b,.course-readonly-note>span').forEach(element => {
    [...element.childNodes].filter(node => node.nodeType === 3).forEach(node => {
      const text = node.textContent.trim();
      const prefix = text.startsWith('＋ ') ? '＋' : null;
      const name = element.matches('[data-delete-assessment]') && text === '×' ? 'trash' : glyphs[prefix || text];
      if (!name) return;
      const holder = document.createElement('span'); holder.innerHTML = uiIcon(name);
      node.replaceWith(holder.firstChild);
      if (prefix) element.append(document.createTextNode(` ${text.slice(2)}`));
      if (element.tagName === 'BUTTON' && !element.textContent.trim() && !element.hasAttribute('aria-label')) element.setAttribute('aria-label', element.title || name);
    });
  });
  root.querySelectorAll('button svg:not(.ui-icon),.calendar-heading-icon svg').forEach(svg => {
    svg.classList.add('ui-icon');
    svg.setAttribute('stroke-width', '1.65');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
  });
}
