/**
 * UI module — DOM rendering for news cards, source cards, and states.
 */

import { isBookmarked, addBookmark, removeBookmark } from './storage.js';
import { renderBookmarkList, updateCount } from './bookmarks.js';

/* ---------- i18n labels ---------- */
const LABELS = {
  en: { readMore: 'Read Full Article', viewNews: 'View News', visitSite: 'Visit Site', fallbackMsg: 'Limited news found for <strong>{d}</strong>. Here are trusted sources you can explore:', searching: 'Searching news…', noResults: 'Search for a district', noResultsDesc: 'Enter any Indian district name to see the latest news.', errorTitle: 'Something went wrong', latestTab: 'Latest News', liveTab: 'Live News', sourcesTab: 'Sources', resultsFor: 'Results for', liveLabel: 'Auto-refresh ON' },
  hi: { readMore: 'पूरा लेख पढ़ें', viewNews: 'समाचार देखें', visitSite: 'साइट पर जाएं', fallbackMsg: '<strong>{d}</strong> के लिए सीमित समाचार मिले। यहाँ विश्वसनीय स्रोत हैं:', searching: 'समाचार खोज रहे हैं…', noResults: 'जिला खोजें', noResultsDesc: 'नवीनतम समाचार देखने के लिए कोई भारतीय जिला नाम दर्ज करें।', errorTitle: 'कुछ गलत हो गया', latestTab: 'ताज़ा खबरें', liveTab: 'लाइव न्यूज़', sourcesTab: 'स्रोत', resultsFor: 'परिणाम', liveLabel: 'ऑटो-रिफ्रेश चालू' },
  mr: { readMore: 'संपूर्ण लेख वाचा', viewNews: 'बातम्या पहा', visitSite: 'साइटला भेट द्या', fallbackMsg: '<strong>{d}</strong> साठी मर्यादित बातम्या सापडल्या. येथे विश्वसनीय स्रोत आहेत:', searching: 'बातम्या शोधत आहे…', noResults: 'जिल्हा शोधा', noResultsDesc: 'नवीनतम बातम्या पाहण्यासाठी कोणत्याही भारतीय जिल्ह्याचे नाव प्रविष्ट करा।', errorTitle: 'काहीतरी चूक झाली', latestTab: 'ताज्या बातम्या', liveTab: 'लाइव्ह न्यूज', sourcesTab: 'स्रोत', resultsFor: 'निकाल', liveLabel: 'ऑटो-रिफ्रेश चालू' },
};

let currentLang = 'en';
export function setUILang(lang) { currentLang = lang; }
function t(key) { return (LABELS[currentLang] || LABELS.en)[key] || LABELS.en[key]; }

/* ---------- Helpers ---------- */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

/* ---------- Tabs ---------- */
export function updateTabLabels() {
  const tabs = document.querySelectorAll('.tab-btn');
  const labels = [t('latestTab'), t('liveTab'), t('sourcesTab')];
  tabs.forEach((tab, i) => { if (labels[i]) tab.textContent = labels[i]; });
}

/* ---------- Hero Headlines ---------- */
export function renderHeroHeadlines(articles) {
  const hero = document.getElementById('heroSection');
  if (!articles || !articles.length) {
    hero.style.display = 'none';
    return;
  }
  hero.style.display = 'block';

  const main = articles[0];
  const side = articles.slice(1, 5);

  const mainCard = `
    <a href="${main.url}" target="_blank" rel="noopener" class="hero-main">
      <div class="hero-main-bg" style="background-image:url('${main.image || ''}')"></div>
      <div class="hero-main-overlay"></div>
      <div class="hero-main-content">
        <span class="hero-badge">TOP STORY</span>
        <h1 class="hero-title">${escapeHtml(main.title)}</h1>
        <p class="hero-desc">${escapeHtml(main.description)}</p>
        <div class="hero-meta">
          <span class="hero-source">${escapeHtml(main.source)}</span>
          <span class="hero-time">${timeAgo(main.publishedAt)}</span>
        </div>
      </div>
    </a>`;

  const sideCards = side.map((a, i) => `
    <a href="${a.url}" target="_blank" rel="noopener" class="hero-side-card" style="animation-delay:${i * 0.08}s">
      <span class="hero-side-num">${String(i + 2).padStart(2, '0')}</span>
      <div class="hero-side-body">
        <h3 class="hero-side-title">${escapeHtml(a.title)}</h3>
        <div class="hero-side-meta">
          <span>${escapeHtml(a.source)}</span>
          <span>${timeAgo(a.publishedAt)}</span>
        </div>
      </div>
    </a>
  `).join('');

  hero.innerHTML = `
    <div class="hero-label">
      <span class="hero-label-dot"></span>
      <span>Trending Headlines</span>
    </div>
    <div class="hero-grid">
      ${mainCard}
      <div class="hero-sidebar">${sideCards}</div>
    </div>`;
}

/* ---------- News Cards ---------- */
export function renderNewsCards(articles, district) {
  const grid = document.getElementById('newsGrid');
  const statusBar = document.getElementById('statusBar');

  statusBar.innerHTML = `
    <span class="status-text">${t('resultsFor')} <strong>${escapeHtml(district)}</strong> — ${articles.length} articles</span>
    <span class="live-indicator"><span class="live-dot"></span> ${t('liveLabel')}</span>`;

  if (!articles.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">📰</div>
        <div class="empty-state-title">${t('noResults')}</div>
        <div class="empty-state-desc">${t('noResultsDesc')}</div>
      </div>`;
    return;
  }

  grid.innerHTML = articles.map(a => {
    const bm = isBookmarked(a.url);
    const img = a.image
      ? `<img class="card-image" src="${a.image}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'card-image-placeholder\\'>📰</div>'">`
      : '<div class="card-image-placeholder">📰</div>';
    return `
    <article class="news-card">
      ${img}
      <div class="card-body">
        <div class="card-source">
          <span class="card-source-name">${escapeHtml(a.source)}</span>
          <span class="card-date">${timeAgo(a.publishedAt)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(a.title)}</h3>
        <p class="card-desc">${escapeHtml(a.description)}</p>
        <div class="card-actions">
          <a href="${a.url}" target="_blank" rel="noopener" class="card-link">${t('readMore')}</a>
          <button class="card-bookmark-btn ${bm ? 'bookmarked' : ''}" data-url="${a.url}" data-title="${escapeHtml(a.title)}" data-source="${escapeHtml(a.source)}" title="Bookmark">🔖</button>
        </div>
      </div>
    </article>`;
  }).join('');

  // Bookmark click handlers
  grid.querySelectorAll('.card-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (isBookmarked(url)) {
        removeBookmark(url);
        btn.classList.remove('bookmarked');
      } else {
        addBookmark({ url, title: btn.dataset.title, source: btn.dataset.source });
        btn.classList.add('bookmarked');
      }
      renderBookmarkList();
      updateCount();
    });
  });
}

/* ---------- Source Cards ---------- */
export function renderSourceCards(sources, district) {
  const grid = document.getElementById('newsGrid');
  const statusBar = document.getElementById('statusBar');

  statusBar.innerHTML = `<span class="status-text">${t('resultsFor')} <strong>${escapeHtml(district)}</strong></span>`;

  const banner = `
    <div class="fallback-banner" style="grid-column:1/-1">
      <span class="fallback-banner-icon">💡</span>
      <span class="fallback-banner-text">${t('fallbackMsg').replace('{d}', escapeHtml(district))}</span>
    </div>`;

  const cards = sources.map(s => {
    const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const langTags = (s.languages || []).map(l => `<span class="source-lang-tag">${l}</span>`).join('');
    return `
    <div class="source-card">
      <div class="source-header">
        <div class="source-logo" style="background:${s.color || '#333'}">${initials}</div>
        <div>
          <div class="source-name">${escapeHtml(s.name)}</div>
          <div class="source-langs">${langTags}</div>
        </div>
      </div>
      <p class="source-desc">${escapeHtml(s.description)}</p>
      <div class="source-actions">
        <a href="${s.searchUrl || s.website}" target="_blank" rel="noopener" class="source-btn primary">${t('viewNews')}</a>
        <a href="${s.website}" target="_blank" rel="noopener" class="source-btn">${t('visitSite')}</a>
      </div>
    </div>`;
  }).join('');

  grid.innerHTML = banner + '<div class="sources-grid" style="grid-column:1/-1">' + cards + '</div>';
}

/* ---------- All Sources Tab ---------- */
export function renderAllSources(sources) {
  const grid = document.getElementById('newsGrid');
  const statusBar = document.getElementById('statusBar');
  statusBar.innerHTML = `<span class="status-text">Trusted Indian News Sources — ${sources.length} sources</span>`;

  const cards = sources.map(s => {
    const initials = (s.name || '').split(' ').map(w => w[0]).join('').slice(0, 2);
    const langTags = (s.languages || []).map(l => `<span class="source-lang-tag">${l}</span>`).join('');
    return `
    <div class="source-card">
      <div class="source-header">
        <div class="source-logo" style="background:${s.color || '#333'}">${initials}</div>
        <div>
          <div class="source-name">${escapeHtml(s.name || '')}</div>
          <div class="source-langs">${langTags}</div>
        </div>
      </div>
      <p class="source-desc">${escapeHtml(s.description || '')}</p>
      <div class="source-actions">
        <a href="${s.website || '#'}" target="_blank" rel="noopener" class="source-btn primary">${t('visitSite')}</a>
      </div>
    </div>`;
  }).join('');

  grid.innerHTML = '<div class="sources-grid" style="grid-column:1/-1">' + cards + '</div>';
}

/* ---------- Loading / Error ---------- */
export function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
export function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }

export function showError(msg) {
  const el = document.createElement('div');
  el.className = 'error-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export function showEmptyState() {
  const grid = document.getElementById('newsGrid');
  document.getElementById('statusBar').innerHTML = '';
  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🇮🇳</div>
      <div class="empty-state-title">${t('noResults')}</div>
      <div class="empty-state-desc">${t('noResultsDesc')}</div>
    </div>`;
}

/* ---------- Recent Searches ---------- */
export function renderRecentSearches(searches, onClick) {
  const container = document.getElementById('recentSearches');
  if (!searches.length) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<span class="recent-label">Recent:</span>' +
    searches.slice(0, 6).map(s => `<button class="recent-chip">${escapeHtml(s)}</button>`).join('');
  container.querySelectorAll('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => onClick(chip.textContent));
  });
}
