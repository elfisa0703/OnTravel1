import {ADMIN_SCHEMAS} from '../components/modals.js';
import {
  renderEmptyState,
  reportStatusLabel,
  t,
} from '../components/ui.js';
import {categoryLabel} from '../data/i18n.js';
import {getEffectiveRole, store} from '../state/store.js';
import {escapeHTML, money} from '../utils/format.js';

/**
 * Render verification report queue rows for Operators and Admins.
 * Operators may process pending/in_review items; terminal items lock cleanly for operators.
 * @param {boolean} allowOverrideTerminal
 */
export function renderVerificationQueueTable(allowOverrideTerminal = false) {
  const reports = store.reports;
  if (!reports.length) {
    return renderEmptyState(t('operatorQueueTab'), t('noReportsFound'));
  }

  return `<div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>${escapeHTML(t('name'))}</th>
          <th>${escapeHTML(t('verification'))}</th>
          <th>Status</th>
          <th>${escapeHTML(t('resolutionNoteLabel'))}</th>
          <th class="num">${escapeHTML(t('actions'))}</th>
        </tr>
      </thead>
      <tbody>
        ${reports
          .map((rep) => {
            const isTerminal =
              rep.status === 'verified' || rep.status === 'rejected';
            const locked = isTerminal && !allowOverrideTerminal;

            return `<tr>
              <td>
                <strong>${escapeHTML(rep.targetName)}</strong><br />
                <span class="mono" style="font-size:11px;color:var(--muted)">
                  ${escapeHTML(rep.targetType)} · ${escapeHTML(rep.targetId)}
                </span><br />
                <span class="small-muted">${escapeHTML(rep.authorName)}</span>
              </td>
              <td style="max-width:260px">${escapeHTML(rep.note)}</td>
              <td>
                <select
                  class="inline-select"
                  id="rep_status_${escapeHTML(rep.id)}"
                  ${locked ? 'disabled' : ''}
                  aria-label="Status ${escapeHTML(rep.targetName)}"
                >
                  <option value="in_review" ${
                    rep.status === 'in_review' || rep.status === 'pending'
                      ? 'selected'
                      : ''
                  }>${escapeHTML(reportStatusLabel('in_review'))}</option>
                  <option value="verified" ${
                    rep.status === 'verified' ? 'selected' : ''
                  }>${escapeHTML(reportStatusLabel('verified'))}</option>
                  <option value="rejected" ${
                    rep.status === 'rejected' ? 'selected' : ''
                  }>${escapeHTML(reportStatusLabel('rejected'))}</option>
                </select>
                <div class="small-muted" style="margin-top:4px">${escapeHTML(
                  reportStatusLabel(rep.status),
                )}</div>
              </td>
              <td>
                <input
                  type="text"
                  class="inline-input"
                  id="rep_note_${escapeHTML(rep.id)}"
                  maxlength="400"
                  value="${escapeHTML(rep.resolutionNote || '')}"
                  placeholder="${escapeHTML(t('resolutionNoteLabel'))}"
                  ${locked ? 'disabled' : ''}
                />
              </td>
              <td class="num">
                <div class="card-actions" style="justify-content:flex-end">
                  ${
                    !locked
                      ? `<button
                          type="button"
                          class="btn small"
                          data-action="review-report"
                          data-id="${escapeHTML(rep.id)}"
                        >${escapeHTML(t('updateStatusBtn'))}</button>`
                      : `<span class="small-muted">—</span>`
                  }
                  ${
                    allowOverrideTerminal
                      ? `<button
                          type="button"
                          class="btn small danger"
                          data-action="delete-report"
                          data-id="${escapeHTML(rep.id)}"
                        >${escapeHTML(t('delete'))}</button>`
                      : ''
                  }
                </div>
              </td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>`;
}

/**
 * Render Operator catalog table (Add & Edit allowed; Delete strictly excluded).
 * @param {'destinations'|'culinary'|'stays'|'packages'} type
 */
function renderOperatorCatalogRows(type) {
  /** @type {any[]} */
  const records = store.db[type];
  if (!records.length) {
    return `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">${escapeHTML(
      t('noResult'),
    )}</td></tr>`;
  }

  return records
    .map((item) => {
      const categoryDisplay =
        type === 'destinations'
          ? categoryLabel(item.kategori, store.ui.lang)
          : item.kategori ||
            (Array.isArray(item.minat)
              ? item.minat
                  .map((/** @type {string} */ m) => categoryLabel(m, store.ui.lang))
                  .join(', ')
              : '—');
      const costValue =
        item.estimasiBiaya ?? item.harga ?? item.hargaPerMalam ?? 0;

      return `<tr>
        <td>
          <strong>${escapeHTML(item.nama)}</strong><br />
          <span class="mono" style="font-size:11px;color:var(--muted)">${escapeHTML(
            item.id,
          )}</span>
        </td>
        <td>${escapeHTML(item.wilayah || '—')}</td>
        <td>${escapeHTML(categoryDisplay)}</td>
        <td class="num">${escapeHTML(money(costValue))}</td>
        <td class="num">
          <button
            type="button"
            class="btn small ghost"
            data-action="edit"
            data-type="${type}"
            data-id="${escapeHTML(item.id)}"
          >${escapeHTML(t('edit'))}</button>
        </td>
      </tr>`;
    })
    .join('');
}

export function renderOperatorView() {
  const role = getEffectiveRole();
  if (role !== 'operator' && role !== 'admin') {
    return `
      <section class="page-head">
        <span class="kicker">${escapeHTML(t('roleOperator'))}</span>
        <h1>${escapeHTML(t('accessDeniedTitle'))}</h1>
      </section>
      ${renderEmptyState(
        t('accessDeniedTitle'),
        t('accessDeniedOperator'),
        `<button type="button" class="btn" data-view="login">${escapeHTML(
          t('goToLogin'),
        )}</button>`,
      )}
    `;
  }

  const activeTab = store.ui.operatorTab;
  const catalogTabs = /** @type {Array<'destinations'|'culinary'|'stays'|'packages'>} */ (
    Object.keys(ADMIN_SCHEMAS)
  );

  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('roleOperator'))}</span>
      <h1>${escapeHTML(t('operatorTitle'))}</h1>
      <p>${escapeHTML(t('operatorDesc'))}</p>
    </section>

    <div class="trust-note">${escapeHTML(t('operatorNotice'))}</div>

    <div class="admin-toolbar">
      <div class="admin-tabs" role="tablist" aria-label="${escapeHTML(
        t('operatorTitle'),
      )}">
        <button
          type="button"
          role="tab"
          aria-selected="${activeTab === 'reports'}"
          class="${activeTab === 'reports' ? 'active' : ''}"
          data-action="operator-tab"
          data-type="reports"
        >${escapeHTML(t('operatorQueueTab'))} (${store.reports.length})</button>
        ${catalogTabs
          .map(
            (key) => `<button
              type="button"
              role="tab"
              aria-selected="${activeTab === key}"
              class="${activeTab === key ? 'active' : ''}"
              data-action="operator-tab"
              data-type="${key}"
            >${escapeHTML(ADMIN_SCHEMAS[key].title)} (${
              store.db[key].length
            })</button>`,
          )
          .join('')}
      </div>

      ${
        activeTab !== 'reports'
          ? `<div class="admin-actions-group">
              <button type="button" class="btn small" data-action="new" data-type="${activeTab}">
                + ${escapeHTML(t('addNew'))}
              </button>
            </div>`
          : ''
      }
    </div>

    ${
      activeTab === 'reports'
        ? renderVerificationQueueTable(role === 'admin')
        : `<div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${escapeHTML(t('name'))} / ID</th>
                  <th>${escapeHTML(t('region'))}</th>
                  <th>${escapeHTML(t('category'))}</th>
                  <th class="num">${escapeHTML(t('cost'))}</th>
                  <th class="num">${escapeHTML(t('actions'))}</th>
                </tr>
              </thead>
              <tbody>${renderOperatorCatalogRows(activeTab)}</tbody>
            </table>
          </div>`
    }
  `;
}
