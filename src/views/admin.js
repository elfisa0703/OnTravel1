import {ADMIN_SCHEMAS} from '../components/modals.js';
import {renderEmptyState, roleLabel, t} from '../components/ui.js';
import {categoryLabel} from '../data/i18n.js';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  getEffectiveRole,
  store,
} from '../state/store.js';
import {escapeHTML, money} from '../utils/format.js';
import {renderVerificationQueueTable} from './operator.js';

/**
 * Render rows for the active admin catalog entity table (includes Edit + Delete).
 * @param {'destinations'|'culinary'|'stays'|'packages'} type
 */
function renderAdminCatalogRows(type) {
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
        <td>
          <div class="card-actions" style="justify-content:flex-end">
            <button
              type="button"
              class="btn small ghost"
              data-action="edit"
              data-type="${type}"
              data-id="${escapeHTML(item.id)}"
            >${escapeHTML(t('edit'))}</button>
            <button
              type="button"
              class="btn small danger"
              data-action="delete"
              data-type="${type}"
              data-id="${escapeHTML(item.id)}"
            >${escapeHTML(t('delete'))}</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function renderUsersDirectoryTable() {
  const users = store.usersDirectory;
  if (!users.length) {
    return renderEmptyState(t('usersRoleTab'), t('noUsersFound'));
  }

  const currentUid = store.auth.user?.uid || '';

  return `<div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>${escapeHTML(t('name'))}</th>
          <th>Email</th>
          <th>${escapeHTML(t('realRoleLabel'))}</th>
          <th class="num">${escapeHTML(t('actions'))}</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map((u) => {
            const isBootstrap = u.email === BOOTSTRAP_ADMIN_EMAIL;
            const isSelf = u.uid === currentUid;
            return `<tr>
              <td>
                <strong>${escapeHTML(u.displayName)}</strong><br />
                <span class="mono" style="font-size:11px;color:var(--muted)">${escapeHTML(
                  u.uid,
                )}</span>
              </td>
              <td>${escapeHTML(u.email)}</td>
              <td>
                <select
                  class="inline-select"
                  id="user_role_${escapeHTML(u.uid)}"
                  ${isBootstrap || isSelf ? 'disabled' : ''}
                  aria-label="Role ${escapeHTML(u.displayName)}"
                >
                  <option value="user" ${
                    u.role === 'user' ? 'selected' : ''
                  }>${escapeHTML(roleLabel('user'))}</option>
                  <option value="operator" ${
                    u.role === 'operator' ? 'selected' : ''
                  }>${escapeHTML(roleLabel('operator'))}</option>
                  <option value="admin" ${
                    u.role === 'admin' ? 'selected' : ''
                  }>${escapeHTML(roleLabel('admin'))}</option>
                </select>
              </td>
              <td class="num">
                ${
                  isBootstrap || isSelf
                    ? `<span class="small-muted">${escapeHTML(
                        roleLabel(u.role),
                      )}</span>`
                    : `<button
                        type="button"
                        class="btn small"
                        data-action="assign-role"
                        data-uid="${escapeHTML(u.uid)}"
                      >${escapeHTML(t('assignRole'))}</button>`
                }
              </td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>`;
}

export function renderAdminView() {
  const role = getEffectiveRole();
  if (role !== 'admin') {
    return `
      <section class="page-head">
        <span class="kicker">${escapeHTML(t('roleAdmin'))}</span>
        <h1>${escapeHTML(t('accessDeniedTitle'))}</h1>
      </section>
      ${renderEmptyState(
        t('accessDeniedTitle'),
        t('accessDeniedAdmin'),
        `<button type="button" class="btn" data-view="login">${escapeHTML(
          t('goToLogin'),
        )}</button>`,
      )}
    `;
  }

  const type = store.ui.adminType;
  const catalogTabs = /** @type {Array<'destinations'|'culinary'|'stays'|'packages'>} */ (
    Object.keys(ADMIN_SCHEMAS)
  );
  const isCatalogTab = catalogTabs.includes(/** @type {any} */ (type));

  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('roleAdmin'))}</span>
      <h1>${escapeHTML(t('adminTitle'))}</h1>
      <p>${escapeHTML(t('adminDesc'))}</p>
    </section>

    <div class="trust-note">${escapeHTML(t('adminNotice'))}</div>

    <div class="admin-toolbar">
      <div class="admin-tabs" role="tablist" aria-label="${escapeHTML(
        t('adminTitle'),
      )}">
        ${catalogTabs
          .map(
            (key) => `<button
              type="button"
              role="tab"
              aria-selected="${type === key}"
              class="${type === key ? 'active' : ''}"
              data-action="admin-tab"
              data-type="${key}"
            >${escapeHTML(ADMIN_SCHEMAS[key].title)} (${
              store.db[key].length
            })</button>`,
          )
          .join('')}
        <button
          type="button"
          role="tab"
          aria-selected="${type === 'reports'}"
          class="${type === 'reports' ? 'active' : ''}"
          data-action="admin-tab"
          data-type="reports"
        >${escapeHTML(t('reportsTab'))} (${store.reports.length})</button>
        <button
          type="button"
          role="tab"
          aria-selected="${type === 'users'}"
          class="${type === 'users' ? 'active' : ''}"
          data-action="admin-tab"
          data-type="users"
        >${escapeHTML(t('usersRoleTab'))} (${store.usersDirectory.length})</button>
      </div>

      <div class="admin-actions-group">
        <button type="button" class="btn small secondary" data-action="seed-firestore">
          ${escapeHTML(t('syncFirestore'))}
        </button>
        <button type="button" class="btn small secondary" data-action="export-db">
          ${escapeHTML(t('exportDb'))}
        </button>
        <button type="button" class="btn small secondary" data-action="reset-db">
          ${escapeHTML(t('resetDemo'))}
        </button>
        ${
          isCatalogTab
            ? `<button type="button" class="btn small" data-action="new" data-type="${type}">
                + ${escapeHTML(t('addNew'))}
              </button>`
            : ''
        }
      </div>
    </div>

    ${
      type === 'users'
        ? renderUsersDirectoryTable()
        : type === 'reports'
          ? renderVerificationQueueTable(true)
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
                <tbody>${renderAdminCatalogRows(
                  /** @type {'destinations'|'culinary'|'stays'|'packages'} */ (type),
                )}</tbody>
              </table>
            </div>`
    }
  `;
}
