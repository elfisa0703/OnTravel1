import {
  renderEmptyState,
  reportStatusLabel,
  roleLabel,
  t,
} from '../components/ui.js';
import {
  getEffectiveRole,
  isBootstrappedAdminSession,
  store,
} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

function renderRoleComparisonGrid() {
  return `
    <div class="role-matrix">
      <h2>${escapeHTML(t('roleCompareTitle'))}</h2>
      <div class="role-cards">
        <article class="role-info-card">
          <span class="kicker">01 · ${escapeHTML(t('roleUser'))}</span>
          <h3>${escapeHTML(t('roleUser'))}</h3>
          <p>${escapeHTML(t('roleUserDesc'))}</p>
        </article>
        <article class="role-info-card">
          <span class="kicker">02 · ${escapeHTML(t('roleOperator'))}</span>
          <h3>${escapeHTML(t('roleOperator'))}</h3>
          <p>${escapeHTML(t('roleOperatorDesc'))}</p>
        </article>
        <article class="role-info-card">
          <span class="kicker">03 · ${escapeHTML(t('roleAdmin'))}</span>
          <h3>${escapeHTML(t('roleAdmin'))}</h3>
          <p>${escapeHTML(t('roleAdminDesc'))}</p>
        </article>
      </div>
    </div>
  `;
}

function renderMyReportsSection() {
  const uid = store.auth.user?.uid;
  const mine = store.reports.filter((r) => r.authorUid === uid);

  return `
    <section class="section" style="padding-bottom:8px">
      <div class="section-head" style="margin-bottom:14px">
        <div>
          <span class="kicker">${escapeHTML(t('roleUser'))}</span>
          <h2>${escapeHTML(t('myReportsTitle'))}</h2>
        </div>
      </div>
      ${
        !mine.length
          ? renderEmptyState(
              t('myReportsTitle'),
              t('myReportsEmpty'),
              `<button type="button" class="btn secondary" data-view="destinations">${escapeHTML(
                t('exploreNow'),
              )}</button>`,
            )
          : `<div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>${escapeHTML(t('name'))}</th>
                    <th>${escapeHTML(t('verification'))}</th>
                    <th>Status</th>
                    <th>${escapeHTML(t('resolutionNoteLabel'))}</th>
                  </tr>
                </thead>
                <tbody>
                  ${mine
                    .map(
                      (rep) => `<tr>
                        <td>
                          <strong>${escapeHTML(rep.targetName)}</strong><br />
                          <span class="mono" style="font-size:11px;color:var(--muted)">${escapeHTML(
                            rep.targetType,
                          )} · ${escapeHTML(rep.targetId)}</span>
                        </td>
                        <td>${escapeHTML(rep.note)}</td>
                        <td><span class="status-text status-${escapeHTML(
                          rep.status,
                        )}">${escapeHTML(
                        reportStatusLabel(rep.status),
                      )}</span></td>
                        <td>${escapeHTML(rep.resolutionNote || '—')}</td>
                      </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>`
      }
    </section>
  `;
}

export function renderLoginView() {
  const {status, user, realRole, busy, error} = store.auth;
  const effectiveRole = getEffectiveRole();

  if (status !== 'authenticated' || !user) {
    return `
      <section class="page-head">
        <span class="kicker">${escapeHTML(t('navLogin'))}</span>
        <h1>${escapeHTML(t('loginTitle'))}</h1>
        <p>${escapeHTML(t('loginSubtitle'))}</p>
      </section>

      <div class="auth-layout">
        <section class="panel auth-card">
          <span class="kicker">Google Authentication</span>
          <h3>${escapeHTML(t('signInGoogle'))}</h3>
          <p class="small-muted" style="margin-bottom:20px">${escapeHTML(
            t('loginSubtitle'),
          )}</p>

          ${
            error
              ? `<div class="trust-note" style="border-color:#e9cbc6;background:var(--danger-bg);color:var(--danger);margin-top:0" role="alert">${escapeHTML(
                  error,
                )}</div>`
              : ''
          }

          <button
            type="button"
            class="btn google-signin-btn"
            data-action="google-login"
            ${busy || status === 'loading' ? 'disabled' : ''}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3-4.6 3-7.6z"/>
              <path fill="#f3dca9" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.4-2.6c-.9.6-2.1 1-3.2 1-2.5 0-4.6-1.7-5.4-4H3.1v2.7C4.8 20 8.1 22 12 22z"/>
              <path fill="#cfe3dc" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.3H3.1C2.4 8.7 2 10.3 2 12s.4 3.3 1.1 4.7L6.6 14z"/>
              <path fill="#fff" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8.1 2 4.8 4 3.1 7.3l3.5 2.7c.8-2.3 2.9-4 5.4-4z"/>
            </svg>
            <span>${escapeHTML(
              busy ? t('signingIn') : t('signInGoogle'),
            )}</span>
          </button>

          <p class="small-muted" style="margin:16px 0 0">${escapeHTML(
            t('userStatusLocal'),
          )}</p>
        </section>

        <section class="panel">
          ${renderRoleComparisonGrid()}
        </section>
      </div>
    `;
  }

  const activeSummary =
    effectiveRole === 'admin'
      ? t('roleAdminDesc')
      : effectiveRole === 'operator'
        ? t('roleOperatorDesc')
        : t('roleUserDesc');

  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(roleLabel(effectiveRole))}</span>
      <h1>${escapeHTML(user.displayName)}</h1>
      <p>${escapeHTML(user.email)}</p>
    </section>

    <div class="auth-layout">
      <section class="panel">
        <span class="kicker">${escapeHTML(t('accountSummary'))}</span>
        <h3>${escapeHTML(roleLabel(effectiveRole))}</h3>

        <div class="detail-grid" style="margin-bottom:16px">
          <div class="detail-block">
            <small>${escapeHTML(t('activeRoleLabel'))}</small>
            <b>${escapeHTML(roleLabel(effectiveRole))}</b>
          </div>
          <div class="detail-block">
            <small>${escapeHTML(t('realRoleLabel'))}</small>
            <b>${escapeHTML(roleLabel(realRole))}</b>
          </div>
        </div>

        ${
          isBootstrappedAdminSession()
            ? `<div class="trust-note" style="margin-top:0">${escapeHTML(
                t('bootstrappedAdminNote'),
              )}</div>`
            : ''
        }

        <div class="detail-block" style="margin-bottom:18px">
          <small>${escapeHTML(t('roleCapabilities'))}</small>
          <b>${escapeHTML(activeSummary)}</b>
        </div>

        <div class="planner-actions" style="margin-top:0">
          ${
            effectiveRole === 'operator' || effectiveRole === 'admin'
              ? `<button type="button" class="btn" data-view="operator">${escapeHTML(
                  t('navOperator'),
                )}</button>`
              : ''
          }
          ${
            effectiveRole === 'admin'
              ? `<button type="button" class="btn secondary" data-view="admin">${escapeHTML(
                  t('navAdmin'),
                )}</button>`
              : ''
          }
          <button
            type="button"
            class="btn ghost"
            data-action="logout"
            ${busy ? 'disabled' : ''}
          >${escapeHTML(t('signOut'))}</button>
        </div>
      </section>

      <section class="panel">
        ${
          realRole === 'admin'
            ? `<div class="role-preview-box">
                <span class="kicker">${escapeHTML(t('roleAdmin'))}</span>
                <h3>${escapeHTML(t('rolePreviewTitle'))}</h3>
                <p class="small-muted" style="margin-bottom:14px">${escapeHTML(
                  t('rolePreviewDesc'),
                )}</p>
                <div class="admin-tabs" role="group" aria-label="${escapeHTML(
                  t('rolePreviewTitle'),
                )}">
                  ${/** @type {const} */ (['admin', 'operator', 'user'])
                    .map(
                      (r) => `<button
                        type="button"
                        class="${effectiveRole === r ? 'active' : ''}"
                        data-action="preview-role"
                        data-role="${r}"
                      >${escapeHTML(roleLabel(r))}</button>`,
                    )
                    .join('')}
                </div>
                ${
                  store.auth.previewRole
                    ? `<p class="small-muted" style="margin:12px 0 0;color:var(--gold-ink)">
                        ${escapeHTML(t('previewActiveNote'))}
                        <strong>${escapeHTML(
                          roleLabel(store.auth.previewRole),
                        )}</strong>.
                      </p>`
                    : ''
                }
              </div>`
            : ''
        }
        ${renderRoleComparisonGrid()}
      </section>
    </div>

    ${renderMyReportsSection()}
  `;
}
