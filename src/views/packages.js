import {packageCard, renderCardGrid, renderEmptyState, t} from '../components/ui.js';
import {categoryLabel} from '../data/i18n.js';
import {CATEGORIES} from '../data/seed.js';
import {store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function renderPackageResults() {
  const {interest, budget} = store.ui.recommend;
  let items = [...store.db.packages];

  if (interest) {
    items = items.filter((p) => (p.minat || []).includes(interest));
  }
  items = items.filter((p) => Number(p.estimasiBiaya) <= Number(budget || 0));

  if (!items.length) {
    return renderEmptyState(t('noPackages'), t('budgetHigh'));
  }
  return renderCardGrid(items, packageCard);
}

export function renderPackagesView() {
  const {interest, budget} = store.ui.recommend;
  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navPackages'))}</span>
      <h1>${escapeHTML(t('packagesTitle'))}</h1>
      <p>${escapeHTML(t('packagesDesc'))}</p>
    </section>

    <div class="panel">
      <div class="recommend-controls">
        <div class="field">
          <label for="interestSelect">${escapeHTML(t('interest'))}</label>
          <select id="interestSelect" data-package-filter="interest">
            <option value="">${escapeHTML(t('allInterests'))}</option>
            ${CATEGORIES.filter((c) => c !== 'kuliner')
              .map(
                (c) =>
                  `<option value="${escapeHTML(c)}" ${
                    interest === c ? 'selected' : ''
                  }>${escapeHTML(categoryLabel(c, store.ui.lang))}</option>`,
              )
              .join('')}
          </select>
        </div>

        <div class="field">
          <label for="budgetSelect">${escapeHTML(t('maxBudget'))}</label>
          <input
            id="budgetSelect"
            type="number"
            min="0"
            step="50000"
            value="${Number(budget) || 0}"
            data-package-filter="budget"
          />
        </div>

        <button type="button" class="btn" data-action="recommend">
          ${escapeHTML(t('recommend'))}
        </button>
      </div>
      <p class="small-muted" style="margin:0">${escapeHTML(
        t('packagesRuleNote'),
      )}</p>
    </div>

    <div id="packageResults" style="margin-top:20px">${renderPackageResults()}</div>
  `;
}
