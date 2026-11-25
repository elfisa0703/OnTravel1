import {HERO_IMAGE_URL} from '../data/seed.js';

/**
 * Escape HTML special characters for safe template interpolation.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    /** @type {Record<string, string>} */
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] || char;
  });
}

/**
 * Format numeric amount as Indonesian Rupiah.
 * @param {number|string} n
 * @returns {string}
 */
export function money(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/**
 * Return today's ISO date (YYYY-MM-DD).
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a safe Google Maps search URL for a destination.
 * @param {{mapsUrl?: string, alamat?: string, nama: string, wilayah: string}} item
 * @returns {string}
 */
export function googleMapsUrl(item) {
  if (
    item.mapsUrl &&
    /^https:\/\/(www\.)?google\.com\/maps\//.test(item.mapsUrl)
  ) {
    return item.mapsUrl;
  }
  const query = encodeURIComponent(
    item.alamat || `${item.nama}, ${item.wilayah}, Aceh`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Resolve image URL safely; allows valid data:image/* or https:// URLs, else uses real Aceh photography fallback.
 * @param {{imageUrl?: string, nama?: string, kategori?: string}} item
 * @returns {string}
 */
export function resolveImageSrc(item) {
  const url = String(item?.imageUrl || '').trim();
  if (/^https:\/\//i.test(url)) {
    return url;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);/i.test(url)) {
    return url;
  }
  return HERO_IMAGE_URL;
}

/**
 * Trigger a browser download of a JSON payload.
 * @param {string} filename
 * @param {unknown} payload
 */
export function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
