import { protectPopupInteractions } from './popup-interactions.js';

const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parse = value => new Date(`${value}T12:00:00`);

import { dismissOnPageMovement } from './popup-dismiss.js';
import { uiIcon } from './icons.js';

export function styleDatePicker(input) {
  input.hidden = true;
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-date-picker';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'term-dropdown-trigger calendar-trigger';
  trigger.textContent = input.value ? parse(input.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date';
  trigger.setAttribute('aria-label', `Academic Start: ${trigger.textContent}`);
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  const popup = document.createElement('div');
  popup.id = `${input.id}-calendar`;
  popup.className = 'custom-calendar';
  popup.setAttribute('popover', 'auto');
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Choose Academic Start date');
  trigger.setAttribute('aria-controls', popup.id);
  protectPopupInteractions(popup);
  let viewed = input.value ? parse(input.value) : new Date();
  const allowed = key => (!input.min || key >= input.min) && (!input.max || key <= input.max);
  const close = () => { popup.hidePopover(); trigger.focus(); };
  const choose = date => {
    input.value = dateKey(date);
    close();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const draw = (focusKey) => {
    popup.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'calendar-header';
    const month = document.createElement('strong');
    month.textContent = viewed.toLocaleDateString(undefined, { month: 'long' });
    month.setAttribute('aria-live', 'polite');
    const year = document.createElement('input');
    year.type = 'number'; year.value = viewed.getFullYear(); year.min = input.min.slice(0, 4) || '1900'; year.max = input.max.slice(0, 4) || '2100';
    year.setAttribute('aria-label', 'Calendar year');
    year.addEventListener('change', () => {
      const value = Number(year.value);
      if (!Number.isInteger(value) || value < Number(year.min) || value > Number(year.max)) { year.value = viewed.getFullYear(); return; }
      viewed = new Date(value, viewed.getMonth(), 1, 12); draw(); popup.querySelector('input').focus();
    });
    const nav = (text, offset, label) => {
      const button = document.createElement('button'); button.type = 'button'; button.innerHTML = uiIcon(offset < 0 ? 'left' : 'right'); button.setAttribute('aria-label', label);
      const candidate = new Date(viewed.getFullYear(), viewed.getMonth() + offset, 1, 12);
      const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0, 12);
      button.disabled = (input.min && dateKey(lastDay) < input.min) || (input.max && dateKey(candidate) > input.max);
      button.addEventListener('click', () => { viewed = candidate; draw(); popup.querySelector(`[aria-label="${label}"]`).focus(); });
      return button;
    };
    header.append(nav('‹', -1, 'Previous month'), month, year, nav('›', 1, 'Next month'));
    const grid = document.createElement('div'); grid.className = 'calendar-days';
    for (const day of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']) {
      const label = document.createElement('span'); label.className = 'calendar-weekday'; label.textContent = day; grid.append(label);
    }
    const first = new Date(viewed.getFullYear(), viewed.getMonth(), 1, 12);
    for (let index = 0; index < first.getDay(); index++) grid.append(document.createElement('span'));
    const count = new Date(viewed.getFullYear(), viewed.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= count; day++) {
      const date = new Date(viewed.getFullYear(), viewed.getMonth(), day, 12), key = dateKey(date);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = day; button.dataset.date = key;
      button.setAttribute('aria-label', date.toLocaleDateString(undefined, { dateStyle: 'full' }));
      button.setAttribute('aria-pressed', String(key === input.value));
      if (key === dateKey(new Date())) button.setAttribute('aria-current', 'date');
      button.disabled = !allowed(key);
      button.addEventListener('click', () => choose(date));
      button.addEventListener('keydown', event => {
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        const next = new Date(date); next.setDate(next.getDate() + offsets[event.key]);
        if (!allowed(dateKey(next))) return;
        viewed = next; draw(dateKey(next));
      });
      grid.append(button);
    }
    const today = document.createElement('button'); today.type = 'button'; today.className = 'calendar-today'; today.textContent = 'Today'; today.disabled = !allowed(dateKey(new Date()));
    today.addEventListener('click', () => choose(new Date()));
    popup.append(header, grid, today);
    if (focusKey) popup.querySelector(`[data-date="${focusKey}"]`)?.focus();
  };
  trigger.addEventListener('click', () => {
    if (popup.matches(':popover-open')) { close(); return; }
    draw();
    const rect = trigger.getBoundingClientRect(), width = Math.min(300, innerWidth - 24);
    popup.style.width = `${width}px`;
    popup.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
    const below = innerHeight - rect.bottom;
    popup.style.top = below >= 355 ? `${rect.bottom + 6}px` : 'auto';
    popup.style.bottom = below >= 355 ? 'auto' : `${innerHeight - rect.top + 6}px`;
    popup.style.maxHeight = `${Math.max(100, (below >= 355 ? below : rect.top) - 18)}px`;
    popup.showPopover();
    (popup.querySelector('[aria-pressed="true"]') || popup.querySelector('[aria-current="date"]') || popup.querySelector('.calendar-days button:not(:disabled)'))?.focus();
  });
  popup.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  popup.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(popup.matches(':popover-open'))));
  input.after(wrapper); wrapper.append(trigger, popup);
  dismissOnPageMovement(popup);
}
