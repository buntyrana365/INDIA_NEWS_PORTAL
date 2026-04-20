/**
 * App — main controller. Initializes everything, wires events, manages auto-refresh.
 */

import { fetchNews, fetchSources, fetchHeadlines } from './api.js';
import { saveRecentSearch, getRecentSearches, getSavedLang, saveLang } from './storage.js';
import { initBookmarks } from './bookmarks.js';
import {
  renderNewsCards, renderSourceCards, renderAllSources, renderHeroHeadlines,
  showLoading, hideLoading, showError, showEmptyState,
  renderRecentSearches, setUILang, updateTabLabels
} from './ui.js';

/* ---------- State ---------- */
let currentDistrict = '';
let currentLang = getSavedLang();
let currentTab = 'latest'; // latest | live | sources
let autoRefreshId = null;
const AUTO_REFRESH_MS = 30000;

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Language
  const langSelect = document.getElementById('langSelect');
  langSelect.value = currentLang;
  setUILang(currentLang);
  updateTabLabels();

  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    saveLang(currentLang);
    setUILang(currentLang);
    updateTabLabels();
    // Reload headlines with new language
    loadHeadlines();
    if (currentDistrict) doSearch(currentDistrict);
  });

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  searchBtn.addEventListener('click', () => {
    const val = searchInput.value.trim();
    if (val) { currentTab = 'latest'; activateTab('latest'); doSearch(val); }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) { currentTab = 'latest'; activateTab('latest'); doSearch(val); }
    }
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      activateTab(currentTab);
      handleTabSwitch();
    });
  });

  // Recent searches
  renderRecentSearches(getRecentSearches(), (term) => {
    searchInput.value = term;
    currentTab = 'latest';
    activateTab('latest');
    doSearch(term);
  });

  // Bookmarks
  initBookmarks();

  // Load top headlines on page load
  loadHeadlines();

  // Show empty state in the grid initially
  showEmptyState();
});

/* ---------- Load Headlines ---------- */
async function loadHeadlines() {
  try {
    const data = await fetchHeadlines(currentLang);
    renderHeroHeadlines(data.articles || []);
  } catch (err) {
    console.error('Failed to load headlines:', err);
    // Hide hero section on error
    const hero = document.getElementById('heroSection');
    if (hero) hero.style.display = 'none';
  }
}

/* ---------- Tab UI ---------- */
function activateTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

/* ---------- Tab Logic ---------- */
async function handleTabSwitch() {
  if (currentTab === 'sources') {
    stopAutoRefresh();
    showLoading();
    try {
      const data = await fetchSources(currentDistrict, currentLang);
      renderAllSources(data.sources || []);
    } catch (err) {
      showError('Failed to load sources');
    } finally {
      hideLoading();
    }
  } else if (currentTab === 'live') {
    if (currentDistrict) {
      doSearch(currentDistrict);
      startAutoRefresh();
    }
  } else {
    stopAutoRefresh();
    if (currentDistrict) doSearch(currentDistrict);
    else showEmptyState();
  }
}

/* ---------- Search ---------- */
async function doSearch(district) {
  currentDistrict = district;
  saveRecentSearch(district);
  renderRecentSearches(getRecentSearches(), (term) => {
    document.getElementById('searchInput').value = term;
    currentTab = 'latest';
    activateTab('latest');
    doSearch(term);
  });

  showLoading();

  try {
    const data = await fetchNews(district, currentLang);

    if (data.fallback) {
      renderSourceCards(data.sources || [], district);
      if (data.articles && data.articles.length > 0) {
        renderNewsCards(data.articles, district);
      }
    } else {
      renderNewsCards(data.articles, district);
    }

    // Start auto-refresh on live tab
    if (currentTab === 'live') startAutoRefresh();
    else stopAutoRefresh();

  } catch (err) {
    console.error(err);
    showError(err.message || 'Failed to fetch news');
    showEmptyState();
  } finally {
    hideLoading();
  }
}

/* ---------- Auto-refresh ---------- */
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshId = setInterval(() => {
    if (currentDistrict && currentTab === 'live') doSearch(currentDistrict);
  }, AUTO_REFRESH_MS);
}

function stopAutoRefresh() {
  if (autoRefreshId) { clearInterval(autoRefreshId); autoRefreshId = null; }
}
