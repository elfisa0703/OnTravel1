import {renderCardGrid, stayCard, t} from '../components/ui.js';
import {REGIONS} from '../data/seed.js';
import {store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function renderStaysResults() {
  const q = store.ui.staysQ.trim().toLowerCase();
  const region = store.ui.staysRegion;
  const items = store.db.stays.filter((s) => {
    const matchText =
      !q ||
      [s.nama, s.wilayah, ...(s.fasilitas || [])]
        .join(' ')
        .toLowerCase()
        .includes(q);
    const matchRegion = !region || s.wilayah === region;
    return matchText && matchRegion;
  });

  const resetBtn =
    q || region
      ? `<button type="button" class="btn small secondary" data-action="reset-stays-filters">${escapeHTML(
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
    ${renderCardGrid(items, stayCard, resetBtn)}
  `;
}

export function renderStaysView() {
  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navStays'))}</span>
      <h1>${escapeHTML(t('stayTitle'))}</h1>
      <p>${escapeHTML(t('stayDesc'))}</p>
    </section>

    <div class="filters two-col">
      <div class="field">
        <label for="staysSearch">${escapeHTML(t('search'))}</label>
        <input
          id="staysSearch"
          type="search"
          data-live-search="stays"
          value="${escapeHTML(store.ui.staysQ)}"
          placeholder="${escapeHTML(t('staySearchPlaceholder'))}"
        />
      </div>

      <div class="field">
        <label for="staysRegion">${escapeHTML(t('region'))}</label>
        <select id="staysRegion" data-filter="stays-region">
          <option value="">${escapeHTML(t('allRegions'))}</option>
          ${REGIONS.map(
            (r) =>
              `<option value="${escapeHTML(r)}" ${
                store.ui.staysRegion === r ? 'selected' : ''
              }>${escapeHTML(r)}</option>`,
          ).join('')}
        </select>
      </div>
    </div>

    <div id="staysResults">${renderStaysResults()}</div>

    <div class="trust-note">
      <strong>${escapeHTML(t('halalCaution'))}</strong>
      ${escapeHTML(t('stayDesc'))}
    </div>
  `;
}
