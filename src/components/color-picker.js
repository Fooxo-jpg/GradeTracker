import { protectPopupInteractions } from './popup-interactions.js';

import { dismissOnPageMovement } from './popup-dismiss.js';

function hexToHsv(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) h = (max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
  return { h, s: max ? delta / max : 0, v: max };
}
function hsvToHex({ h, s, v }) {
  const c = v * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = v - c;
  const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return '#' + rgb.map(value => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('');
}

export function styleColorPicker(input) {
  // A visually hidden type=color is still activated by its wrapping label.
  // Keep only a hidden value field; the custom controls own all interaction.
  input.type = 'hidden';
  const container = input.closest('.color-setting');
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.className = 'accent-picker-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
  const popup = document.createElement('div');
  popup.id = 'accent-picker-popup'; popup.className = 'accent-picker-popup'; popup.setAttribute('popover', 'auto'); popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', 'Choose accent colour');
  trigger.setAttribute('aria-controls', popup.id);
  protectPopupInteractions(popup);
  popup.innerHTML = '<strong>Accent colour</strong><div class="accent-palette" role="group" aria-label="Accent presets"></div><label class="accent-hex-label">Hex colour<div><span>#</span><input class="accent-hex-input" type="text" maxlength="6" spellcheck="false" aria-label="Six-digit hex colour"><button type="button" class="accent-hex-apply">Apply</button></div></label><p class="accent-picker-error" role="status"></p>';
  const hex = popup.querySelector('input');
  const spectrum = document.createElement('div');
  spectrum.className = 'accent-spectrum'; spectrum.tabIndex = 0;
  spectrum.setAttribute('role', 'group');
  spectrum.setAttribute('aria-label', 'Saturation and brightness. Use left and right arrows for saturation, up and down for brightness.');
  const cursor = document.createElement('i'); cursor.className = 'accent-spectrum-cursor'; spectrum.append(cursor);
  const hueLabel = document.createElement('label'); hueLabel.className = 'accent-hue-label'; hueLabel.textContent = 'Hue';
  const hue = document.createElement('input'); hue.type = 'range'; hue.min = '0'; hue.max = '359'; hue.step = '1'; hue.className = 'accent-hue'; hue.setAttribute('aria-label', 'Hue'); hueLabel.append(hue);
  const preview = document.createElement('div'); preview.className = 'accent-live-preview'; preview.setAttribute('aria-hidden', 'true');
  const controls = document.createElement('div'); controls.className = 'accent-hue-controls'; controls.append(preview, hueLabel);
  popup.querySelector('.accent-palette').before(spectrum, controls);
  let hsv = hexToHsv(input.value);
  const paint = (writeHex = true, live = true) => {
    spectrum.style.backgroundColor = `hsl(${hsv.h} 100% 50%)`;
    cursor.style.left = `${hsv.s * 100}%`; cursor.style.top = `${(1 - hsv.v) * 100}%`;
    const color = hsvToHex(hsv);
    preview.style.background = color;
    spectrum.setAttribute('aria-description', `Selected colour ${color}`);
    hue.value = Math.round(hsv.h);
    if (writeHex) hex.value = color.slice(1).toUpperCase();
    if (live) {
      input.value = color;
      trigger.innerHTML = `<i style="background:${color}"></i><span>${color.toUpperCase()}</span><small>Choose colour</small>`;
      trigger.setAttribute('aria-label', `Accent colour ${color}`);
      popup.querySelectorAll('.accent-swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === color)));
      // Use the existing settings input handler to apply and save immediately.
      // Keep HSV intact here so dragging through grey/black retains the hue.
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  const move = event => {
    const rect = spectrum.getBoundingClientRect();
    hsv.s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    hsv.v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    paint();
  };
  spectrum.addEventListener('pointerdown', event => { if (event.button !== 0) return; event.preventDefault(); spectrum.focus({ preventScroll: true }); spectrum.setPointerCapture(event.pointerId); move(event); });
  spectrum.addEventListener('pointermove', event => { if (spectrum.hasPointerCapture(event.pointerId)) move(event); });
  spectrum.addEventListener('pointerup', event => { if (spectrum.hasPointerCapture(event.pointerId)) spectrum.releasePointerCapture(event.pointerId); });
  spectrum.addEventListener('keydown', event => {
    const step = event.shiftKey ? .1 : .01;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') hsv.s -= step;
    if (event.key === 'ArrowRight') hsv.s += step;
    if (event.key === 'ArrowUp') hsv.v += step;
    if (event.key === 'ArrowDown') hsv.v -= step;
    hsv.s = Math.max(0, Math.min(1, hsv.s)); hsv.v = Math.max(0, Math.min(1, hsv.v)); paint();
  });
  hue.addEventListener('input', () => { hsv.h = Number(hue.value); paint(); });
  hex.addEventListener('input', () => { if (/^[a-f\d]{6}$/i.test(hex.value)) { hsv = hexToHsv(`#${hex.value}`); paint(false); } });
  const colors = [['Coral','#ff6047'],['Amber','#d69a24'],['Green','#329d69'],['Blue','#4d79df'],['Violet','#9163db']];
  const update = () => {
    trigger.innerHTML = `<i style="background:${input.value}"></i><span>${input.value.toUpperCase()}</span><small>Choose colour</small>`;
    trigger.setAttribute('aria-label', `Accent colour ${input.value}`);
    hex.value = input.value.slice(1).toUpperCase();
    hsv = hexToHsv(input.value); paint(false, false);
    popup.querySelectorAll('.accent-swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === input.value.toLowerCase())));
  };
  const choose = value => {
    input.value = value;
    update(); popup.hidePopover(); trigger.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  colors.forEach(([name, color]) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'accent-swatch'; button.style.background = color; button.dataset.color = color;
    button.setAttribute('aria-label', `${name}, ${color}`); button.title = name;
    button.addEventListener('click', () => choose(color)); popup.querySelector('.accent-palette').append(button);
  });
  const apply = () => {
    if (!/^[a-f\d]{6}$/i.test(hex.value.trim())) { popup.querySelector('.accent-picker-error').textContent = 'Enter six hex digits, e.g. FF6047.'; hex.focus(); return; }
    choose(`#${hex.value.trim()}`);
  };
  hex.addEventListener('input', () => popup.querySelector('.accent-picker-error').textContent = '');
  hex.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); apply(); } });
  popup.querySelector('.accent-hex-apply').addEventListener('click', apply);
  trigger.addEventListener('click', () => {
    if (popup.matches(':popover-open')) { popup.hidePopover(); return; }
    update(); popup.querySelector('.accent-picker-error').textContent = '';
    // Reset the browser's default centered-popover insets, then measure it
    // while visible so placement uses its actual height.
    Object.assign(popup.style, { inset: 'auto', margin: '0', width: `${Math.min(300, innerWidth - 24)}px`, maxHeight: `${innerHeight - 24}px`, visibility: 'hidden' });
    popup.showPopover();
    const rect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const below = innerHeight - rect.bottom - 18;
    const above = rect.top - 18;
    const openBelow = below >= popupRect.height || below >= above;
    popup.style.maxHeight = `${Math.max(80, openBelow ? below : above)}px`;
    const height = popup.getBoundingClientRect().height;
    popup.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - popupRect.width - 12))}px`;
    popup.style.top = `${Math.max(12, Math.min(openBelow ? rect.bottom + 6 : rect.top - height - 6, innerHeight - height - 12))}px`;
    popup.style.visibility = 'visible';
    (popup.querySelector('[aria-pressed="true"]') || hex).focus({ preventScroll: true });
  });
  popup.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(popup.matches(':popover-open'))));
  popup.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); popup.hidePopover(); trigger.focus(); } });
  container.classList.add('custom-accent-setting'); container.append(trigger, popup); update();
  dismissOnPageMovement(popup);
}
