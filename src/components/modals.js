import {categoryLabel} from '../data/i18n.js';
import {CATEGORIES, REGIONS} from '../data/seed.js';
import {
  getDestinationById,
  getEffectiveRole,
  saveCatalogRecord,
  store,
  submitVerificationReport,
} from '../state/store.js';
import {escapeHTML, googleMapsUrl, money, resolveImageSrc} from '../utils/format.js';
import {showToast, t} from './ui.js';

/** @type {HTMLElement|null} */
let lastFocusedElement = null;
/** @type {(() => void)|null} */
let pendingConfirmAction = null;

/**
 * Mount HTML inside #modalRoot and move focus into the dialog.
 * @param {string} innerHtml
 * @param {boolean} [small=false]
 */
function mountModal(innerHtml, small = false) {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  root.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close">
    <div class="modal ${small ? 'modal-sm' : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">
      ${innerHtml}
    </div>
  </div>`;
  const dialog = root.querySelector('.modal');
  if (dialog instanceof HTMLElement) {
    dialog.focus();
  }
}

export function closeModal() {
  const root = document.getElementById('modalRoot');
  if (!root || !root.innerHTML) return;
  root.innerHTML = '';
  pendingConfirmAction = null;
  if (lastFocusedElement && lastFocusedElement.isConnected) {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

/**
 * Open destination detail modal.
 * @param {string} id
 */
export function openDetailModal(id) {
  const d = getDestinationById(id);
  if (!d) {
    showToast(t('notFound'));
    return;
  }
  const src = resolveImageSrc(d);
  const role = getEffectiveRole();
  const canEdit = role === 'operator' || role === 'admin';
  const html = `
    <div class="modal-head">
      <div>
        <span class="kicker">${escapeHTML(
          categoryLabel(d.kategori, store.ui.lang),
        )} · ${escapeHTML(d.wilayah)}</span>
        <h3 id="modalTitle">${escapeHTML(d.nama)}</h3>
      </div>
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHTML(
        t('close'),
      )}">✕</button>
    </div>
    <div class="modal-media-wrap">
      <img class="modal-media" referrerpolicy="no-referrer" src="${escapeHTML(
        src,
      )}" alt="${escapeHTML(d.nama)}" data-fallback-title="${escapeHTML(d.nama)}" />
    </div>
    <p style="font-size:14px;color:var(--ink-secondary);margin:16px 0 0">${escapeHTML(
      d.deskripsi,
    )}</p>
    <div class="detail-grid">
      <div class="detail-block">
        <small>${escapeHTML(t('cost'))}</small>
        <b class="tabular">${escapeHTML(money(d.estimasiBiaya))} · ${escapeHTML(
    t('priceSim'),
  )}</b>
      </div>
      <div class="detail-block">
        <small>${escapeHTML(t('region'))}</small>
        <b>${escapeHTML(d.wilayah)}</b>
      </div>
      <div class="detail-block">
        <small>${escapeHTML(t('facilities'))}</small>
        <b>${escapeHTML((d.fasilitas || []).join(' · ') || t('notChecked'))}</b>
      </div>
      <div class="detail-block">
        <small>${escapeHTML(t('prayer'))}</small>
        <b>${escapeHTML(d.fasilitasIbadah || t('caveat'))}</b>
      </div>
    </div>
    <p class="small-muted" style="margin-top:14px">
      <strong>${escapeHTML(t('verification'))}:</strong> ${escapeHTML(
    d.verifikasi || t('caveat'),
  )}
    </p>
    <div class="modal-actions">
      ${
        role !== 'guest'
          ? `<button type="button" class="btn secondary" data-action="open-report" data-target-type="destinations" data-target-id="${escapeHTML(
              d.id,
            )}" data-target-name="${escapeHTML(d.nama)}">${escapeHTML(
              t('submitReportBtn'),
            )}</button>`
          : ''
      }
      ${
        canEdit
          ? `<button type="button" class="btn ghost" data-action="edit" data-type="destinations" data-id="${escapeHTML(
              d.id,
            )}">${escapeHTML(t('edit'))}</button>`
          : ''
      }
      <a class="btn secondary" href="${escapeHTML(
        googleMapsUrl(d),
      )}" target="_blank" rel="noopener noreferrer">${escapeHTML(t('map'))} ↗</a>
      <button type="button" class="btn" data-action="add-itinerary" data-id="${escapeHTML(
        d.id,
      )}">${escapeHTML(t('addPlan'))}</button>
    </div>
  `;
  mountModal(html);
}

/**
 * Open simulated contact disclosure modal.
 * @param {string} name
 */
export function openContactModal(name) {
  const html = `
    <div class="modal-head">
      <div>
        <span class="kicker">${escapeHTML(t('demoLabel'))}</span>
        <h3 id="modalTitle">${escapeHTML(t('simContact'))}</h3>
      </div>
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHTML(
        t('close'),
      )}">✕</button>
    </div>
    <p style="color:var(--forest);font-weight:700;margin-bottom:12px">${escapeHTML(
      name,
    )}</p>
    <div class="trust-note">${escapeHTML(t('contactDemo'))}</div>
    <p class="small-muted">${escapeHTML(t('contactBody'))}</p>
    <div class="modal-actions">
      <button type="button" class="btn" data-action="close-modal">${escapeHTML(
        t('ok'),
      )}</button>
    </div>
  `;
  mountModal(html, true);
}

/**
 * Open Verification Report submission modal for signed-in users.
 * @param {'destinations'|'culinary'|'stays'} targetType
 * @param {string} targetId
 * @param {string} targetName
 */
export function openReportModal(targetType, targetId, targetName) {
  if (!store.auth.user) {
    showToast(t('reportSignInRequired'));
    return;
  }
  const html = `
    <div class="modal-head">
      <div>
        <span class="kicker">${escapeHTML(targetName)}</span>
        <h3 id="modalTitle">${escapeHTML(t('reportModalTitle'))}</h3>
      </div>
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHTML(
        t('close'),
      )}">✕</button>
    </div>
    <p class="small-muted" style="margin-bottom:14px">${escapeHTML(
      t('reportModalDesc'),
    )}</p>
    <form id="reportForm" data-target-type="${escapeHTML(
      targetType,
    )}" data-target-id="${escapeHTML(targetId)}" data-target-name="${escapeHTML(
    targetName,
  )}">
      <div class="field">
        <label for="reportNoteInput">${escapeHTML(t('reportNoteLabel'))}</label>
        <textarea
          id="reportNoteInput"
          name="note"
          rows="4"
          minlength="5"
          maxlength="600"
          required
          placeholder="${escapeHTML(t('reportNotePlaceholder'))}"
        ></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn secondary" data-action="close-modal">${escapeHTML(
          t('cancel'),
        )}</button>
        <button type="submit" class="btn">${escapeHTML(
          t('submitReportBtn'),
        )}</button>
      </div>
    </form>
  `;
  mountModal(html, true);
}

/**
 * Submit a verification report to Firestore.
 * @param {HTMLFormElement} form
 * @param {() => void} onSaved
 */
export async function handleReportFormSubmit(form, onSaved) {
  const targetType = /** @type {'destinations'|'culinary'|'stays'} */ (
    form.dataset.targetType || 'destinations'
  );
  const targetId = form.dataset.targetId || '';
  const targetName = form.dataset.targetName || 'Item';
  const noteInput = form.elements.namedItem('note');
  const note =
    noteInput instanceof HTMLTextAreaElement ? noteInput.value.trim() : '';

  if (note.length < 5) {
    showToast(t('reportNoteLabel'));
    return;
  }

  try {
    await submitVerificationReport({targetType, targetId, targetName, note});
    closeModal();
    showToast(t('reportSubmitted'));
    onSaved();
  } catch (err) {
    showToast(err instanceof Error ? err.message : t('notFound'));
  }
}

/**
 * Open accessible confirmation modal (replaces native window.confirm).
 * @param {{title?: string, message: string, confirmLabel?: string, danger?: boolean, onConfirm: () => void}} opts
 */
export function openConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
}) {
  pendingConfirmAction = onConfirm;
  const html = `
    <div class="modal-head">
      <h3 id="modalTitle">${escapeHTML(title || t('confirmTitle'))}</h3>
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHTML(
        t('close'),
      )}">✕</button>
    </div>
    <p style="font-size:14px;color:var(--ink-secondary);margin-bottom:8px">${escapeHTML(
      message,
    )}</p>
    <div class="modal-actions">
      <button type="button" class="btn secondary" data-action="close-modal">${escapeHTML(
        t('cancel'),
      )}</button>
      <button type="button" class="btn ${danger ? 'danger' : ''}" data-action="confirm-modal-ok">${escapeHTML(
    confirmLabel || t('confirm'),
  )}</button>
    </div>
  `;
  mountModal(html, true);
}

export function executePendingConfirm() {
  const fn = pendingConfirmAction;
  closeModal();
  if (typeof fn === 'function') {
    fn();
  }
}

/**
 * @typedef {Array<[string, string, 'text'|'number'|'select'|'textarea'|'checkbox', string[]?]>} AdminFields
 */

/** @type {Record<'destinations'|'culinary'|'stays'|'packages', {title: string, fields: AdminFields}>} */
export const ADMIN_SCHEMAS = {
  destinations: {
    title: 'Destinasi',
    fields: [
      ['nama', 'Nama destinasi', 'text'],
      ['kategori', 'Kategori', 'select', CATEGORIES],
      ['wilayah', 'Wilayah', 'select', REGIONS],
      ['estimasiBiaya', 'Estimasi biaya (Rp)', 'number'],
      ['alamat', 'Alamat lengkap', 'text'],
      ['imageUrl', 'URL gambar HTTPS (opsional)', 'text'],
      ['mapsUrl', 'Tautan Google Maps HTTPS (opsional)', 'text'],
      ['deskripsi', 'Deskripsi singkat', 'textarea'],
      ['fasilitas', 'Fasilitas (pisahkan dengan koma)', 'text'],
      ['fasilitasIbadah', 'Informasi fasilitas ibadah', 'textarea'],
      ['verifikasi', 'Catatan verifikasi', 'textarea'],
      ['unggulan', 'Tampilkan sebagai destinasi unggulan', 'checkbox'],
    ],
  },
  culinary: {
    title: 'Kuliner',
    fields: [
      ['nama', 'Nama kuliner / produk', 'text'],
      ['kategori', 'Kategori / jenis', 'text'],
      ['wilayah', 'Wilayah', 'select', REGIONS],
      ['harga', 'Harga simulasi (Rp)', 'number'],
      [
        'statusSertifikasiHalal',
        'Status sertifikasi halal',
        'select',
        [
          'Belum diverifikasi',
          'Dalam proses verifikasi',
          'Terverifikasi resmi — isi hanya setelah pemeriksaan',
        ],
      ],
      ['sumberVerifikasi', 'Sumber verifikasi / catatan', 'text'],
      ['kontak', 'Informasi kontak', 'text'],
      ['imageUrl', 'URL gambar HTTPS (opsional)', 'text'],
    ],
  },
  stays: {
    title: 'Akomodasi',
    fields: [
      ['nama', 'Nama akomodasi', 'text'],
      ['wilayah', 'Wilayah', 'select', REGIONS],
      ['hargaPerMalam', 'Harga per malam (Rp)', 'number'],
      ['fasilitas', 'Fasilitas umum (pisahkan dengan koma)', 'text'],
      [
        'fasilitasRamahMuslim',
        'Catatan fasilitas ramah Muslim',
        'textarea',
      ],
      ['kontak', 'Informasi kontak', 'text'],
      ['imageUrl', 'URL gambar HTTPS (opsional)', 'text'],
    ],
  },
  packages: {
    title: 'Paket wisata',
    fields: [
      ['nama', 'Nama paket', 'text'],
      ['durasi', 'Durasi (hari)', 'number'],
      ['wilayah', 'Wilayah utama', 'select', REGIONS],
      ['estimasiBiaya', 'Estimasi biaya (Rp)', 'number'],
      [
        'daftarDestinasi',
        'ID destinasi (pisahkan dengan koma, mis. d01, d02)',
        'text',
      ],
      [
        'minat',
        'Kategori minat (pisahkan koma: religi, alam, bahari, sejarah, budaya)',
        'text',
      ],
      ['deskripsi', 'Deskripsi paket', 'textarea'],
      ['imageUrl', 'URL gambar HTTPS (opsional)', 'text'],
    ],
  },
};

/**
 * Open create/edit modal for Operator & Admin Content Studio.
 * @param {'destinations'|'culinary'|'stays'|'packages'} type
 * @param {string|null} [id=null]
 */
export function openAdminFormModal(type, id = null) {
  const schema = ADMIN_SCHEMAS[type];
  /** @type {Record<string, any>|undefined} */
  const existing = id
    ? store.db[type].find((item) => item.id === id)
    : undefined;

  if (id && !existing) {
    showToast(t('notFound'));
    return;
  }

  const fieldsHtml = schema.fields
    .map(([key, label, kind, options]) => {
      let value = existing ? existing[key] : '';
      if (
        (key === 'fasilitas' || key === 'minat' || key === 'daftarDestinasi') &&
        Array.isArray(value)
      ) {
        value = value.join(', ');
      }
      const isFull =
        kind === 'textarea' ||
        kind === 'checkbox' ||
        key === 'nama' ||
        key === 'alamat' ||
        key === 'imageUrl' ||
        key === 'mapsUrl' ||
        key === 'fasilitas' ||
        key === 'daftarDestinasi' ||
        key === 'minat';
      const wrapClass = isFull ? 'field full' : 'field';

      if (kind === 'select' && options) {
        return `<div class="${wrapClass}">
          <label for="admin_${key}">${escapeHTML(label)}</label>
          <select id="admin_${key}" name="${key}">
            ${options
              .map((opt) => {
                const selected =
                  String(value || options[0]) === String(opt) ? 'selected' : '';
                const text =
                  type === 'destinations' && key === 'kategori'
                    ? categoryLabel(opt, store.ui.lang)
                    : opt;
                return `<option value="${escapeHTML(
                  opt,
                )}" ${selected}>${escapeHTML(text)}</option>`;
              })
              .join('')}
          </select>
        </div>`;
      }

      if (kind === 'textarea') {
        return `<div class="${wrapClass}">
          <label for="admin_${key}">${escapeHTML(label)}</label>
          <textarea id="admin_${key}" name="${key}" rows="3" maxlength="800" ${
          key === 'deskripsi' ? 'required' : ''
        }>${escapeHTML(value || '')}</textarea>
        </div>`;
      }

      if (kind === 'checkbox') {
        return `<div class="field full">
          <label class="checkbox-row">
            <input type="checkbox" name="${key}" ${value ? 'checked' : ''} />
            <span>${escapeHTML(label)}</span>
          </label>
        </div>`;
      }

      return `<div class="${wrapClass}">
        <label for="admin_${key}">${escapeHTML(label)}</label>
        <input
          id="admin_${key}"
          name="${key}"
          type="${kind}"
          value="${escapeHTML(value ?? '')}"
          ${kind === 'number' ? 'min="0" step="1000"' : 'maxlength="240"'}
          ${key === 'nama' ? 'required' : ''}
        />
      </div>`;
    })
    .join('');

  const html = `
    <div class="modal-head">
      <div>
        <span class="kicker">${escapeHTML(schema.title)}</span>
        <h3 id="modalTitle">${escapeHTML(id ? t('edit') : t('addNew'))}</h3>
      </div>
      <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHTML(
        t('close'),
      )}">✕</button>
    </div>
    <form id="adminForm" data-type="${type}" data-id="${escapeHTML(id || '')}">
      <div class="form-grid">${fieldsHtml}</div>
      <div class="modal-actions">
        <button type="button" class="btn secondary" data-action="close-modal">${escapeHTML(
          t('cancel'),
        )}</button>
        <button type="submit" class="btn">${escapeHTML(t('save'))}</button>
      </div>
    </form>
  `;
  mountModal(html);
}

/**
 * Save admin/operator catalog form data to Firestore + local store and re-render.
 * @param {HTMLFormElement} form
 * @param {() => void} onSaved
 */
export function handleAdminFormSubmit(form, onSaved) {
  const type = /** @type {'destinations'|'culinary'|'stays'|'packages'} */ (
    form.dataset.type
  );
  const existingId = form.dataset.id || '';
  const id = existingId || `${type[0]}${Date.now()}`;
  const schema = ADMIN_SCHEMAS[type];
  /** @type {Record<string, any>} */
  const record = {id};

  for (const [key, , kind] of schema.fields) {
    const control = form.elements.namedItem(key);
    if (!control) continue;
    if (kind === 'checkbox' && control instanceof HTMLInputElement) {
      record[key] = control.checked;
    } else if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLSelectElement ||
      control instanceof HTMLTextAreaElement
    ) {
      let val = /** @type {any} */ (control.value);
      if (kind === 'number') {
        val = Math.max(0, Number(val) || 0);
      } else if (
        key === 'fasilitas' ||
        key === 'minat' ||
        key === 'daftarDestinasi'
      ) {
        val = String(val)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        val = String(val).trim();
      }
      record[key] = val;
    }
  }

  if (type === 'destinations') {
    record.imageUrl = record.imageUrl || '';
    record.mapsUrl = record.mapsUrl || '';
    record.unggulan = Boolean(record.unggulan);
  }

  const commitRecord = async () => {
    try {
      await saveCatalogRecord(type, id, record, !existingId);
      closeModal();
      showToast(t('updated'));
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('notFound'));
    }
  };

  if (
    type === 'culinary' &&
    String(record.statusSertifikasiHalal || '').startsWith(
      'Terverifikasi resmi',
    )
  ) {
    if (!String(record.sumberVerifikasi || '').trim()) {
      showToast(t('halalSourceRequired'));
      return;
    }
    record.statusSertifikasiHalal = 'Terverifikasi resmi';
    openConfirmModal({
      title: t('halalStatus'),
      message: t('halalConfirm'),
      onConfirm: () => {
        void commitRecord();
      },
    });
    return;
  }

  void commitRecord();
}
