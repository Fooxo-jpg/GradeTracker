import changelog from '../../CHANGELOG.md?raw';
import { version } from '../../package.json';

export const appVersion = version;

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Release notes support headings, bullet lists, and plain paragraphs.
// Escape all text so markdown content cannot inject HTML into the app.
export function renderChangelog() {
  const html = [];
  let inList = false;
  let inVersion = false;
  for (const line of changelog.split(/\r?\n/)) {
    const bullet = /^-\s+(.+)$/.exec(line);
    if (!bullet && inList) { html.push('</ul>'); inList = false; }
    if (bullet) {
      if (!inList) { html.push('<ul>'); inList = true; }
      html.push(`<li>${escapeHtml(bullet[1])}</li>`);
    } else if (line.startsWith('## ')) {
      if (inVersion) html.push('</div></details>');
      const heading = line.slice(3).trim();
      const label = /^\d/.test(heading) ? `Version ${heading}` : heading;
      html.push(`<details class="release-version"><summary>${escapeHtml(label)}</summary><div class="release-version-body">`);
      inVersion = true;
    } else if (line.startsWith('### ')) {
      html.push(`<h4>${escapeHtml(line.slice(4))}</h4>`);
    } else if (line.trim() && !line.startsWith('# ')) {
      html.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  if (inVersion) html.push('</div></details>');
  return `<div class="release-notes">${html.join('')}</div>`;
}
