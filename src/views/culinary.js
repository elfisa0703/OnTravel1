import {culinaryCard, renderCardGrid, t} from '../components/ui.js';
import {REGIONS} from '../data/seed.js';
import {store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function renderCulinaryResults() {
  const q = store.ui.culinaryQ.trim().toLowerCase();
  const region = store.ui.culinaryRegion;
  const items = store.db.culinary.filter((c) => {
    const matchText =
      !q ||
      [c.nama, c.kategori, c.wilayah, c.sumberVerifikasi]
        .join(' ')
        .toLowerCase()
        .includes(q);
    const matchRegion = !region || c.wilayah === region;
    return matchText && matchRegion;
  });

  const resetBtn =
    q || region
      ? `<button type="button" class="btn small secondary" data-action="reset-culinary-filters">${escapeHTML(
          t('resetFilters'),
        )}</button>`
      : '';

  return `
    <div class="result-bar">
      <span><strong class="tabular">${items.length}</strong> ${escapeHTML(
    t('result'),
  )}</span>
      ${resetBtn}
    </div>
    ${renderCardGrid(items, culinaryCard, resetBtn)}
  `;
}

export function renderCulinaryView() {
  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navCulinary'))} · UMKM</span>
      <h1>${escapeHTML(t('culinaryTitle'))}</h1>
      <p>${escapeHTML(t('culinaryDesc'))}</p>
    </section>

    <div class="filters two-col">
      <div class="field">
        <label for="culinarySearch">${escapeHTML(t('search'))}</label>
        <input
          id="culinarySearch"
          type="search"
          data-live-search="culinary"
          value="${escapeHTML(store.ui.culinaryQ)}"
          placeholder="${escapeHTML(t('culinarySearchPlaceholder'))}"
        />
      </div>

      <div class="field">
        <label for="culinaryRegion">${escapeHTML(t('region'))}</label>
        <select id="culinaryRegion" data-filter="culinary-region">
          <option value="">${escapeHTML(t('allRegions'))}</option>
          ${REGIONS.map(
            (r) =>
              `<option value="${escapeHTML(r)}" ${
                store.ui.culinaryRegion === r ? 'selected' : ''
              }>${escapeHTML(r)}</option>`,
          ).join('')}
        </select>
      </div>
    </div>

    <div id="culinaryResults">${renderCulinaryResults()}</div>

    <div class="trust-note">
      <strong>${escapeHTML(t('halalCaution'))}</strong>
      ${escapeHTML(t('noClaim'))}
    </div>
  `;
}
