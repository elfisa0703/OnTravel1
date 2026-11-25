import {destinationCard, renderCardGrid, t} from '../components/ui.js';
import {HERO_IMAGE_URL, REGIONS} from '../data/seed.js';
import {store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function renderHomeView() {
  const featured = store.db.destinations.filter((d) => d.unggulan).slice(0, 3);
  const destCount = String(store.db.destinations.length).padStart(2, '0');
  const culinaryCount = String(store.db.culinary.length).padStart(2, '0');

  return `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-content">
          <span class="kicker">${escapeHTML(t('heroEyebrow'))}</span>
          <h1>${escapeHTML(t('heroTitle'))}</h1>
          <p class="hero-copy">${escapeHTML(t('heroCopy'))}</p>
          <div class="hero-actions">
            <button type="button" class="btn" data-view="destinations">
              ${escapeHTML(t('exploreNow'))} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" class="btn secondary" data-view="planner">
              ${escapeHTML(t('buildTrip'))}
            </button>
          </div>
          <form class="search-hero" data-action="hero-search-form" role="search">
            <label for="heroSearch" class="sr-only">${escapeHTML(t('search'))}</label>
            <input
              id="heroSearch"
              type="search"
              placeholder="${escapeHTML(t('searchPlaceholder'))}"
            />
            <button type="submit" class="btn small">${escapeHTML(t('search'))}</button>
          </form>
        </div>

        <div class="hero-art">
          <div class="art-main">
            <img
              class="hero-photo"
              src="${escapeHTML(HERO_IMAGE_URL)}"
              alt="Masjid Raya Baiturrahman, Banda Aceh"
              referrerpolicy="no-referrer"
              data-fallback-title="Masjid Raya Baiturrahman · Aceh"
            />
            <div class="art-scrim">
              <small>Serambi Mekkah · Indonesia</small>
              <b>Aceh menanti langkah Anda.</b>
            </div>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <strong>${destCount}</strong>
          <span>${escapeHTML(t('statDest'))}</span>
        </div>
        <div class="stat">
          <strong>05</strong>
          <span>${escapeHTML(t('statRegions'))}</span>
        </div>
        <div class="stat">
          <strong>${culinaryCount}</strong>
          <span>${escapeHTML(t('statLocal'))}</span>
        </div>
        <div class="stat">
          <strong>01–05</strong>
          <span>${escapeHTML(t('statPlan'))}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <span class="kicker">${escapeHTML(t('featured'))}</span>
          <h2>${escapeHTML(t('featuredDesc'))}</h2>
        </div>
        <button type="button" class="text-link" data-view="destinations">
          ${escapeHTML(t('seeAll'))} ↗
        </button>
      </div>
      ${renderCardGrid(featured, destinationCard)}
    </section>

    <section class="section">
      <div class="soft-panel map-layout">
        <div class="map-box">
          <div
            id="acehMap"
            class="google-map-canvas"
            role="region"
            aria-label="${escapeHTML(t('mapIllustrative'))}"
          ></div>
        </div>

        <div class="map-aside">
          <span class="kicker">${escapeHTML(t('discoverRegion'))}</span>
          <h3>${escapeHTML(t('mapTitle'))}</h3>
          <p class="hero-copy" style="font-size:14px;margin-bottom:10px">${escapeHTML(
            t('mapCopy'),
          )}</p>
          <p class="small-muted">${escapeHTML(t('mapCaveat'))}</p>
          <div class="region-list">
            ${REGIONS.map(
              (region, index) => `<button type="button" class="region-pill" data-region="${escapeHTML(
                region,
              )}" data-map-focus="${escapeHTML(region)}">
                <span class="region-index">${index + 1}</span>
                <span>${escapeHTML(region)}</span>
              </button>`,
            ).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <span class="kicker">OnTravel</span>
          <h2>${escapeHTML(t('featureTitle'))}</h2>
        </div>
      </div>
      <div class="feature-strip">
        <div class="feature">
          <span class="feature-index">01</span>
          <h3>${escapeHTML(t('feature1'))}</h3>
          <p>${escapeHTML(t('feature1d'))}</p>
        </div>
        <div class="feature">
          <span class="feature-index">02</span>
          <h3>${escapeHTML(t('feature2'))}</h3>
          <p>${escapeHTML(t('feature2d'))}</p>
        </div>
        <div class="feature">
          <span class="feature-index">03</span>
          <h3>${escapeHTML(t('feature3'))}</h3>
          <p>${escapeHTML(t('feature3d'))}</p>
        </div>
      </div>

      <div class="wide-banner">
        <div>
          <h3>${escapeHTML(t('homeBannerTitle'))}</h3>
          <p>${escapeHTML(t('homeBannerDesc'))}</p>
        </div>
        <button type="button" class="btn" data-view="planner">
          ${escapeHTML(t('buildTrip'))} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  `;
}
