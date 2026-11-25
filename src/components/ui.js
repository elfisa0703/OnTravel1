import {categoryLabel, translate} from '../data/i18n.js';
import {
  getDestinationById,
  getEffectiveRole,
  isFavorite,
  store,
} from '../state/store.js';
import {escapeHTML, money, resolveImageSrc} from '../utils/format.js';

/** @param {string} key */
export const t = (key) => translate(key, store.ui.lang);

/**
 * Localized label for a user role.
 * @param {import('../state/store.js').EffectiveRole|string|null} role
 * @returns {string}
 */
export function roleLabel(role) {
  switch (role) {
    case 'admin':
      return t('roleAdmin');
    case 'operator':
      return t('roleOperator');
    case 'user':
      return t('roleUser');
    default:
      return t('roleGuest');
  }
}

/**
 * Localized label for a verification report status.
 * @param {string} status
 * @returns {string}
 */
export function reportStatusLabel(status) {
  switch (status) {
    case 'in_review':
      return t('statusInReview');
    case 'verified':
      return t('statusVerified');
    case 'rejected':
      return t('statusRejected');
    default:
      return t('statusPending');
  }
}

let toastTimer = 0;

/**
 * Show a temporary toast notification.
 * @param {string} msg
 */
export function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2800);
}

/**
 * Render an image container with resilient fallback if custom URL fails.
 * @param {string} src
 * @param {string} alt
 * @param {string} fallbackTitle
 * @param {string} [cssClass='card-image']
 * @returns {string}
 */
export function renderMediaFrame(
  src,
  alt,
  fallbackTitle,
  cssClass = 'card-image',
) {
  const safeSrc = escapeHTML(src);
  const safeAlt = escapeHTML(alt);
  const safeTitle = escapeHTML(fallbackTitle);
  return `<div class="${cssClass}">
    <img loading="lazy" referrerpolicy="no-referrer" src="${safeSrc}" alt="${safeAlt}" data-fallback-title="${safeTitle}" />
  </div>`;
}

/**
 * @param {number} amount
 * @param {string} [sublabel]
 */
function renderPrice(amount, sublabel) {
  return `<span class="price tabular">${money(amount)}<small>${escapeHTML(
    sublabel || t('priceSim'),
  )}</small></span>`;
}

/**
 * Render role-appropriate inline editorial tools on catalog cards.
 * @param {'destinations'|'culinary'|'stays'|'packages'} entityType
 * @param {string} id
 * @param {string} name
 * @returns {string}
 */
function renderCardRoleLinks(entityType, id, name) {
  const role = getEffectiveRole();
  const canEdit = role === 'operator' || role === 'admin';
  const canReport =
    role !== 'guest' &&
    (entityType === 'destinations' ||
      entityType === 'culinary' ||
      entityType === 'stays');

  if (!canEdit && !canReport) return '';
  return `<div class="card-role-tools">
    ${
      canReport
        ? `<button type="button" class="text-link" data-action="open-report" data-target-type="${entityType}" data-target-id="${escapeHTML(
            id,
          )}" data-target-name="${escapeHTML(name)}">${escapeHTML(
            t('submitReportBtn'),
          )}</button>`
        : ''
    }
    ${
      canEdit
        ? `<button type="button" class="text-link" data-action="edit" data-type="${entityType}" data-id="${escapeHTML(
            id,
          )}">${escapeHTML(t('quickEdit'))}</button>`
        : ''
    }
  </div>`;
}

/**
 * Render empty state panel.
 * @param {string} title
 * @param {string} description
 * @param {string} [actionHtml='']
 * @returns {string}
 */
export function renderEmptyState(title, description, actionHtml = '') {
  return `<div class="empty">
    <strong>${escapeHTML(title)}</strong>
    <p>${escapeHTML(description)}</p>
    ${actionHtml}
  </div>`;
}

/**
 * Render a grid of cards or an empty state.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} renderer
 * @param {string} [emptyActionHtml='']
 * @returns {string}
 */
export function renderCardGrid(items, renderer, emptyActionHtml = '') {
  if (!items.length) {
    return renderEmptyState(t('noResult'), t('noResultDesc'), emptyActionHtml);
  }
  return `<div class="grid">${items.map(renderer).join('')}</div>`;
}

/**
 * @param {import('../data/seed.js').DestinationItem} d
 * @returns {string}
 */
export function destinationCard(d) {
  const fav = isFavorite('destinasi', d.id);
  const src = resolveImageSrc(d);
  const alt = `${d.nama} — ${d.wilayah}`;
  return `<article class="card">
    ${renderMediaFrame(src, alt, d.nama)}
    <div class="card-body">
      <div class="meta-line">
        <span>${escapeHTML(categoryLabel(d.kategori, store.ui.lang))}</span>
        <span class="meta-sep" aria-hidden="true">·</span>
        <span>${escapeHTML(d.wilayah)}</span>
      </div>
      <h3>${escapeHTML(d.nama)}</h3>
      <div class="meta-line">${escapeHTML(d.alamat || 'Aceh')}</div>
      <p class="card-desc">${escapeHTML(d.deskripsi)}</p>
      ${renderCardRoleLinks('destinations', d.id, d.nama)}
      <div class="card-foot">
        ${renderPrice(d.estimasiBiaya)}
        <div class="card-actions">
          <button
            type="button"
            class="icon-btn ${fav ? 'is-fav' : ''}"
            data-action="favorite"
            data-type="destinasi"
            data-id="${escapeHTML(d.id)}"
            aria-label="${escapeHTML(
              fav ? t('removedFavorite') : t('addedFavorite'),
            )} (${escapeHTML(d.nama)})"
            aria-pressed="${fav}"
          >${fav ? '♥' : '♡'}</button>
          <button
            type="button"
            class="btn small"
            data-action="detail"
            data-id="${escapeHTML(d.id)}"
          >${escapeHTML(t('detail'))}</button>
        </div>
      </div>
    </div>
  </article>`;
}

/**
 * @param {import('../data/seed.js').CulinaryItem} c
 * @returns {string}
 */
export function culinaryCard(c) {
  const fav = isFavorite('kuliner', c.id);
  const src = resolveImageSrc(c);
  const isVerified = String(c.statusSertifikasiHalal || '').startsWith(
    'Terverifikasi resmi',
  );
  return `<article class="card">
    ${renderMediaFrame(src, `${c.nama} — ${c.wilayah}`, c.nama)}
    <div class="card-body">
      <div class="meta-line">
        <span>${escapeHTML(c.kategori)}</span>
        <span class="meta-sep" aria-hidden="true">·</span>
        <span>${escapeHTML(c.wilayah)}</span>
      </div>
      <h3>${escapeHTML(c.nama)}</h3>
      <p class="card-desc">${escapeHTML(
        c.sumberVerifikasi || t('noClaim'),
      )}</p>
      <div class="status-line ${isVerified ? 'is-verified' : ''}">
        ${escapeHTML(t('halalStatus'))}: ${escapeHTML(
    c.statusSertifikasiHalal || t('notChecked'),
  )}
      </div>
      ${renderCardRoleLinks('culinary', c.id, c.nama)}
      <div class="card-foot">
        ${renderPrice(c.harga)}
        <div class="card-actions">
          <button
            type="button"
            class="btn small ghost"
            data-action="contact"
            data-name="${escapeHTML(c.nama)}"
          >${escapeHTML(t('contact'))}</button>
          <button
            type="button"
            class="icon-btn ${fav ? 'is-fav' : ''}"
            data-action="favorite"
            data-type="kuliner"
            data-id="${escapeHTML(c.id)}"
            aria-label="${escapeHTML(c.nama)}"
            aria-pressed="${fav}"
          >${fav ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>
  </article>`;
}

/**
 * @param {import('../data/seed.js').StayItem} s
 * @returns {string}
 */
export function stayCard(s) {
  const fav = isFavorite('akomodasi', s.id);
  const src = resolveImageSrc(s);
  return `<article class="card">
    ${renderMediaFrame(src, `${s.nama} — ${s.wilayah}`, s.nama)}
    <div class="card-body">
      <div class="meta-line">
        <span>${escapeHTML(t('stays'))}</span>
        <span class="meta-sep" aria-hidden="true">·</span>
        <span>${escapeHTML(s.wilayah)}</span>
      </div>
      <h3>${escapeHTML(s.nama)}</h3>
      <p class="card-desc">${escapeHTML((s.fasilitas || []).join(' · '))}</p>
      <div class="card-note">
        <strong>${escapeHTML(t('muslimFacilities'))}:</strong>
        ${escapeHTML(s.fasilitasRamahMuslim || t('caveat'))}
      </div>
      ${renderCardRoleLinks('stays', s.id, s.nama)}
      <div class="card-foot">
        ${renderPrice(
          s.hargaPerMalam,
          `${t('perNight')} · ${t('priceSim')}`,
        )}
        <div class="card-actions">
          <button
            type="button"
            class="btn small ghost"
            data-action="contact"
            data-name="${escapeHTML(s.nama)}"
          >${escapeHTML(t('contact'))}</button>
          <button
            type="button"
            class="icon-btn ${fav ? 'is-fav' : ''}"
            data-action="favorite"
            data-type="akomodasi"
            data-id="${escapeHTML(s.id)}"
            aria-label="${escapeHTML(s.nama)}"
            aria-pressed="${fav}"
          >${fav ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>
  </article>`;
}

/**
 * @param {import('../data/seed.js').PackageItem} p
 * @returns {string}
 */
export function packageCard(p) {
  const names = (p.daftarDestinasi || [])
    .map((id) => getDestinationById(id)?.nama)
    .filter(Boolean);
  const firstDest = (p.daftarDestinasi || [])
    .map((id) => getDestinationById(id))
    .find(Boolean);
  const src = resolveImageSrc({
    imageUrl: p.imageUrl || firstDest?.imageUrl || '',
    nama: p.nama,
  });
  const durationLabel = `${p.durasi} ${store.ui.lang === 'id' ? 'hari' : 'days'}`;
  const interestLabels = (p.minat || [])
    .map((m) => categoryLabel(m, store.ui.lang))
    .join(' · ');

  return `<article class="card">
    ${renderMediaFrame(src, `${p.nama} — ${p.wilayah}`, p.nama)}
    <div class="card-body">
      <div class="meta-line">
        <span>${escapeHTML(durationLabel)}</span>
        <span class="meta-sep" aria-hidden="true">·</span>
        <span>${escapeHTML(p.wilayah)}</span>
        ${
          interestLabels
            ? `<span class="meta-sep" aria-hidden="true">·</span><span>${escapeHTML(
                interestLabels,
              )}</span>`
            : ''
        }
      </div>
      <h3>${escapeHTML(p.nama)}</h3>
      <p class="card-desc">${escapeHTML(p.deskripsi)}</p>
      ${
        names.length
          ? `<p class="small-muted" style="margin-bottom:14px">${names
              .map((n) => escapeHTML(n))
              .join(' · ')}</p>`
          : ''
      }
      ${renderCardRoleLinks('packages', p.id, p.nama)}
      <div class="card-foot">
        ${renderPrice(p.estimasiBiaya)}
        <button
          type="button"
          class="btn small"
          data-action="add-package"
          data-id="${escapeHTML(p.id)}"
        >${escapeHTML(t('packageAdd'))}</button>
      </div>
    </div>
  </article>`;
}
