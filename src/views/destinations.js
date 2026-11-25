import {destinationCard, renderCardGrid, t} from '../components/ui.js';
import {categoryLabel} from '../data/i18n.js';
import {CATEGORIES, REGIONS} from '../data/seed.js';
import {store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function getFilteredDestinations() {
  let list = [...store.db.destinations];
  const {q, region, category, sort} = store.ui.filters;

  if (q) {
    const term = q.toLowerCase();
    list = list.filter((d) =>
      [d.nama, d.deskripsi, d.wilayah, d.kategori, d.alamat]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }
  if (region) {
    list = list.filter((d) => d.wilayah === region);
  }
  if (category) {
    list = list.filter((d) => d.kategori === category);
  }

  if (sort === 'name') {
    list.sort((a, b) => a.nama.localeCompare(b.nama));
  } else if (sort === 'cost') {
    list.sort((a, b) => a.estimasiBiaya - b.estimasiBiaya);
  } else {
    list.sort((a, b) => Number(b.unggulan) - Number(a.unggulan));
  }
  return list;
}

export function renderDestinationResults() {
  const items = getFilteredDestinations();
  const hasFilters = Boolean(
    store.ui.filters.q || store.ui.filters.region || store.ui.filters.category,
  );
  const resetBtn = hasFilters
    ? `<button type="button" class="btn small secondary" data-action="reset-dest-filters">${escapeHTML(
        t('resetFilters'),
      )}</button>`
    : '';

  return `
    <div class="result-bar">
      <span><strong class="tabular">${items.length}</strong> ${escapeHTML(
    t('result'),
  )}</span>
      <div style="display:flex;align-items:center;gap:12px">
        <span>${escapeHTML(store.ui.filters.region || t('allRegions'))}</span>
        ${resetBtn}
      </div>
    </div>
    ${renderCardGrid(items, destinationCard, resetBtn)}
  `;
}

export function renderDestinationsView() {
  const {q, region, category, sort} = store.ui.filters;
  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navExplore'))}</span>
      <h1>${escapeHTML(t('destTitle'))}</h1>
      <p>${escapeHTML(t('destDesc'))}</p>
    </section>

    <div class="filters">
      <div class="field">
        <label for="destSearch">${escapeHTML(t('search'))}</label>
        <input
          id="destSearch"
          type="search"
          data-live-search="dest"
          value="${escapeHTML(q)}"
          placeholder="${escapeHTML(t('searchPlaceholder'))}"
        />
      </div>

      <div class="field">
        <label for="regionFilter">${escapeHTML(t('region'))}</label>
        <select id="regionFilter" data-filter="region">
          <option value="">${escapeHTML(t('allRegions'))}</option>
          ${REGIONS.map(
            (r) =>
              `<option value="${escapeHTML(r)}" ${
                region === r ? 'selected' : ''
              }>${escapeHTML(r)}</option>`,
          ).join('')}
        </select>
      </div>

      <div class="field">
        <label for="categoryFilter">${escapeHTML(t('category'))}</label>
        <select id="categoryFilter" data-filter="category">
          <option value="">${escapeHTML(t('allCategories'))}</option>
          ${CATEGORIES.map(
            (c) =>
              `<option value="${escapeHTML(c)}" ${
                category === c ? 'selected' : ''
              }>${escapeHTML(categoryLabel(c, store.ui.lang))}</option>`,
          ).join('')}
        </select>
      </div>

      <div class="field">
        <label for="sortFilter">${escapeHTML(t('sortLabel'))}</label>
        <select id="sortFilter" data-filter="sort">
          <option value="featured" ${
            sort === 'featured' ? 'selected' : ''
          }>${escapeHTML(t('sortFeatured'))}</option>
          <option value="name" ${sort === 'name' ? 'selected' : ''}>${escapeHTML(
    t('sortName'),
  )}</option>
          <option value="cost" ${sort === 'cost' ? 'selected' : ''}>${escapeHTML(
    t('sortCost'),
  )}</option>
        </select>
      </div>
    </div>

    <div id="destResults">${renderDestinationResults()}</div>

    <div class="trust-note">
      <strong>${escapeHTML(t('notVerified'))}:</strong>
      ${escapeHTML(t('caveat'))}
    </div>
  `;
}
