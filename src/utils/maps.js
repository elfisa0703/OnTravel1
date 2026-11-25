/// <reference types="google.maps" />
import {importLibrary, setOptions} from '@googlemaps/js-api-loader';
import {t} from '../components/ui.js';
import {store} from '../state/store.js';

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

/** @type {Record<string, string>} */
const REGION_QUERIES = {
  'Banda Aceh': 'Banda Aceh, Aceh, Indonesia',
  Sabang: 'Sabang, Aceh, Indonesia',
  'Aceh Besar': 'Aceh Besar, Aceh, Indonesia',
  'Aceh Tengah': 'Takengon, Aceh Tengah, Aceh, Indonesia',
  'Bener Meriah': 'Bener Meriah, Aceh, Indonesia',
};

let hooksInstalled = false;
let loaderConfigured = false;

/**
 * In-memory cache of resolved region place metadata for the active browser session.
 * Coordinates always originate from active Places API (New) responses.
 * @type {Map<string, {region: string, displayName: string, formattedAddress: string, location: google.maps.LatLng}>}
 */
const regionPlaceCache = new Map();

/** @type {google.maps.Map|null} */
let activeMap = null;
/** @type {google.maps.InfoWindow|null} */
let activeInfoWindow = null;
/** @type {Map<string, {marker: google.maps.marker.AdvancedMarkerElement, place: {region: string, displayName: string, formattedAddress: string, location: google.maps.LatLng}}>} */
const activeRegionMarkers = new Map();

/**
 * Register global listeners for Google Maps authentication/quota errors.
 */
export function installGmpQuotaHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  /** @type {any} */ (window).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  const origError = console.error;
  console.error = (...args) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('OverQuotaMapError') ||
      msg.includes('QuotaExceededError')
    ) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

/**
 * Check rejected Promises or RPC errors for Google Maps quota exhaustion.
 * @param {unknown} err
 */
function notifyIfQuotaError(err) {
  const msg =
    err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '');
  if (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('429') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('OverQuotaMapError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

/**
 * Configure Maps JS API loader once with environment key.
 * @param {'id'|'en'} lang
 * @returns {boolean}
 */
function ensureLoaderConfigured(lang) {
  const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY') {
    return false;
  }
  if (!loaderConfigured) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      language: lang === 'en' ? 'en' : 'id',
      region: 'ID',
    });
    loaderConfigured = true;
  }
  return true;
}

/**
 * Build interactive InfoWindow content safely using DOM nodes.
 * @param {{region: string, displayName: string, formattedAddress: string}} item
 * @param {google.maps.marker.AdvancedMarkerElement} marker
 */
function openRegionInfoWindow(item, marker) {
  if (!activeMap || !activeInfoWindow) return;

  const destCount = store.db.destinations.filter(
    (d) => d.wilayah === item.region,
  ).length;

  const header = document.createElement('div');
  header.className = 'map-iw-title';
  header.textContent = item.region;

  const body = document.createElement('div');
  body.className = 'map-iw-body';

  const addr = document.createElement('p');
  addr.className = 'map-iw-addr';
  addr.textContent = item.formattedAddress || item.displayName;
  body.appendChild(addr);

  const count = document.createElement('p');
  count.className = 'map-iw-count';
  count.textContent = `${destCount} ${t('mapDestCount')}`;
  body.appendChild(count);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn small';
  btn.setAttribute('data-region', item.region);
  btn.textContent = `${t('mapViewDest')} ↗`;
  body.appendChild(btn);

  activeInfoWindow.setHeaderContent(header);
  activeInfoWindow.setContent(body);
  activeInfoWindow.open({
    map: activeMap,
    anchor: marker,
    shouldFocus: false,
  });
}

/**
 * Focus a region marker when user interacts with region buttons.
 * @param {string} region
 */
export function focusRegionOnMap(region) {
  const entry = activeRegionMarkers.get(region);
  if (!entry || !activeMap) return;
  activeMap.panTo(entry.place.location);
  openRegionInfoWindow(entry.place, entry.marker);
}

/**
 * Render an inline fallback message if Maps key is unavailable or map load fails.
 * @param {HTMLElement} containerEl
 */
function renderMapFallback(containerEl) {
  containerEl.innerHTML = `<div class="map-fallback">
    <strong>Aceh</strong>
    <p>${t('mapError')}</p>
  </div>`;
}

/**
 * Mount the interactive Google Map of Aceh regions into containerEl.
 * @param {HTMLElement} containerEl
 * @param {string[]} regions
 * @param {'id'|'en'} lang
 */
export async function mountAcehMap(containerEl, regions, lang) {
  if (!ensureLoaderConfigured(lang)) {
    renderMapFallback(containerEl);
    return;
  }

  containerEl.innerHTML = `<div class="map-loading">${t('mapLoading')}</div>`;

  try {
    const [{Map: GoogleMap, InfoWindow}, {AdvancedMarkerElement, PinElement}, {Place}, {LatLngBounds}] =
      await Promise.all([
        importLibrary('maps'),
        importLibrary('marker'),
        importLibrary('places'),
        importLibrary('core'),
      ]);

    if (!containerEl.isConnected) return;

    /** @type {Array<{region: string, displayName: string, formattedAddress: string, location: google.maps.LatLng}>} */
    const resolvedRegions = [];

    const searches = regions.map(async (region) => {
      const cached = regionPlaceCache.get(region);
      if (cached) {
        resolvedRegions.push(cached);
        return;
      }
      const {places} = await Place.searchByText({
        textQuery: REGION_QUERIES[region] || `${region}, Aceh, Indonesia`,
        fields: ['displayName', 'location', 'formattedAddress'],
        region: 'id',
        language: lang === 'en' ? 'en' : 'id',
        maxResultCount: 1,
        internalUsageAttributionIds: [ATTRIBUTION_ID],
      });
      const place = places?.[0];
      if (place?.location) {
        const entry = {
          region,
          displayName: place.displayName || region,
          formattedAddress: place.formattedAddress || `${region}, Aceh`,
          location: place.location,
        };
        regionPlaceCache.set(region, entry);
        resolvedRegions.push(entry);
      }
    });

    await Promise.all(searches);

    if (!containerEl.isConnected) return;

    if (!resolvedRegions.length) {
      renderMapFallback(containerEl);
      return;
    }

    // Order resolved results consistently with REGIONS list
    resolvedRegions.sort(
      (a, b) => regions.indexOf(a.region) - regions.indexOf(b.region),
    );

    containerEl.innerHTML = '';

    activeRegionMarkers.clear();
    activeMap = new GoogleMap(containerEl, {
      center: resolvedRegions[0].location,
      zoom: 8,
      mapId: 'DEMO_MAP_ID',
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      internalUsageAttributionIds: [ATTRIBUTION_ID],
    });

    activeInfoWindow = new InfoWindow({maxWidth: 260});
    const bounds = new LatLngBounds();

    resolvedRegions.forEach((item, idx) => {
      const pin = new PinElement({
        background: '#073f37',
        borderColor: '#d49d39',
        glyphColor: '#f4e2b8',
        glyphText: String(idx + 1),
      });

      const marker = new AdvancedMarkerElement({
        map: activeMap,
        position: item.location,
        content: pin,
        title: item.region,
      });

      marker.addListener('click', () => {
        activeMap?.panTo(item.location);
        openRegionInfoWindow(item, marker);
      });

      activeRegionMarkers.set(item.region, {marker, place: item});
      bounds.extend(item.location);
    });

    if (resolvedRegions.length > 1) {
      activeMap.fitBounds(bounds, {top: 40, right: 36, bottom: 36, left: 36});
    }
  } catch (err) {
    notifyIfQuotaError(err);
    if (containerEl.isConnected) {
      renderMapFallback(containerEl);
    }
  }
}
