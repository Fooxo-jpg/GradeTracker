import { protectPopupInteractions } from './popup-interactions.js';

import { dismissOnPageMovement } from './popup-dismiss.js';

export function styleTermDropdown(select) {
  const label = select.getAttribute('aria-label') || 'Select an option';
  select.hidden = true;
  const wrapper = document.createElement('div');
  wrapper.className = 'term-dropdown';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'term-dropdown-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.id = `${select.id}-menu`;
  menu.className = 'term-dropdown-menu';
  menu.setAttribute('popover', 'auto');
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', label);
  trigger.setAttribute('aria-controls', menu.id);
  protectPopupInteractions(menu);
  const options = [];
  const addOption = option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'term-dropdown-option';
    button.setAttribute('role', 'option');
    button.dataset.value = option.value;
    button.textContent = option.textContent;
    button.addEventListener('click', () => {
      select.value = option.value;
      update();
      menu.hidePopover();
      trigger.focus();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    options.push(button);
    return button;
  };
  for (const child of select.children) {
    if (child.tagName === 'OPTGROUP') {
      const group = document.createElement('div');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', child.label);
      const label = document.createElement('div');
      label.className = 'term-dropdown-year';
      label.textContent = child.label;
      label.setAttribute('aria-hidden', 'true');
      group.append(label);
      for (const option of child.children) group.append(addOption(option));
      menu.append(group);
    } else menu.append(addOption(child));
  }
  const update = () => {
    const option = select.selectedOptions[0];
    trigger.textContent = option?.parentElement.tagName === 'OPTGROUP' ? `${option.parentElement.label} · ${option.textContent}` : option?.textContent || 'All terms';
    trigger.title = trigger.textContent;
    trigger.setAttribute('aria-label', `${label}: ${trigger.textContent}`);
    options.forEach(button => {
      button.hidden = [...select.options].find(option => option.value === button.dataset.value)?.hidden || false;
      const selected = button.dataset.value === select.value;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  };
  const open = (last = false) => {
    update();
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const openBelow = below >= 220 || below >= above;
    Object.assign(menu.style, {
      width: `${width}px`, left: `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`,
      top: openBelow ? `${rect.bottom + 6}px` : 'auto',
      bottom: openBelow ? 'auto' : `${window.innerHeight - rect.top + 6}px`,
      maxHeight: `${Math.max(80, Math.min(360, openBelow ? below - 6 : above - 6))}px`
    });
    menu.showPopover();
    const visible = options.filter(button => !button.hidden);
    const focus = last ? visible.at(-1) : visible.find(button => button.dataset.value === select.value) || visible[0];
    focus?.focus();
  };
  trigger.addEventListener('click', () => menu.matches(':popover-open') ? menu.hidePopover() : open());
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(event.key === 'ArrowUp'); }
  });
  menu.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(menu.matches(':popover-open'))));
  menu.addEventListener('keydown', event => {
    const visible = options.filter(button => !button.hidden);
    if (!visible.length) return;
    const index = visible.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % visible.length;
    if (event.key === 'ArrowUp') next = (index - 1 + visible.length) % visible.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = visible.length - 1;
    if (next !== undefined) { event.preventDefault(); visible[next].focus(); }
    if (event.key === 'Escape') { event.preventDefault(); menu.hidePopover(); trigger.focus(); }
    if (event.key === 'Tab') { menu.hidePopover(); trigger.focus(); }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== ' ') {
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
      const match = ordered.find(option => option.textContent.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match) { event.preventDefault(); match.focus(); }
    }
  });
  select.after(wrapper);
  wrapper.append(trigger, menu);
  dismissOnPageMovement(menu);
  select.addEventListener('change', update);
  select.form?.addEventListener('reset', () => queueMicrotask(update));
  update();
}
