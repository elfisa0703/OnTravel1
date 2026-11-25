import {
  culinaryCard,
  destinationCard,
  renderCardGrid,
  renderEmptyState,
  stayCard,
  t,
} from '../components/ui.js';
import {getDestinationById, store} from '../state/store.js';
import {escapeHTML} from '../utils/format.js';

export function renderFavoritesView() {
  const destinations = store.favorites
    .filter((f) => f.tipeItem === 'destinasi')
    .map((f) => getDestinationById(f.itemId))
    .filter((item) => Boolean(item));

  const culinary = store.favorites
    .filter((f) => f.tipeItem === 'kuliner')
    .map((f) => store.db.culinary.find((c) => c.id === f.itemId))
    .filter((item) => Boolean(item));

  const stays = store.favorites
    .filter((f) => f.tipeItem === 'akomodasi')
    .map((f) => store.db.stays.find((s) => s.id === f.itemId))
    .filter((item) => Boolean(item));

  const totalCount = destinations.length + culinary.length + stays.length;

  const isSignedIn = store.auth.status === 'authenticated';

  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navFavorites'))}</span>
      <h1>${escapeHTML(t('favoritesTitle'))}</h1>
      <p>${escapeHTML(t('favoritesDesc'))}</p>
      <p class="small-muted" style="margin-top:8px">
        ${escapeHTML(isSignedIn ? t('userStatusCloud') : t('userStatusLocal'))}
        ${
          !isSignedIn
            ? ` <button type="button" class="text-link" data-view="login">${escapeHTML(
                t('goToLogin'),
              )}</button>`
            : ''
        }
      </p>
    </section>

    ${
      !totalCount
        ? renderEmptyState(
            t('emptyFav'),
            t('emptyFavDesc'),
            `<button type="button" class="btn" data-view="destinations">${escapeHTML(
              t('goExplore'),
            )}</button>`,
          )
        : ''
    }

    ${
      destinations.length
        ? `<section class="favorites-section">
            <h2>${escapeHTML(t('destination'))}</h2>
            ${renderCardGrid(
              /** @type {import('../data/seed.js').DestinationItem[]} */ (
                destinations
              ),
              destinationCard,
            )}
          </section>`
        : ''
    }

    ${
      culinary.length
        ? `<section class="favorites-section">
            <h2>${escapeHTML(t('culinary'))}</h2>
            ${renderCardGrid(
              /** @type {import('../data/seed.js').CulinaryItem[]} */ (culinary),
              culinaryCard,
            )}
          </section>`
        : ''
    }

    ${
      stays.length
        ? `<section class="favorites-section">
            <h2>${escapeHTML(t('stays'))}</h2>
            ${renderCardGrid(
              /** @type {import('../data/seed.js').StayItem[]} */ (stays),
              stayCard,
            )}
          </section>`
        : ''
    }
  `;
}
