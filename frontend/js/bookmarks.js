/**
 * Bookmarks module — sidebar management.
 */

import { getBookmarks, removeBookmark } from './storage.js';

let sidebarOpen = false;

export function initBookmarks() {
  document.getElementById('bookmarkToggle').addEventListener('click', toggleSidebar);
  document.getElementById('bookmarkClose').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);
  renderBookmarkList();
  updateCount();
}

export function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

function openSidebar() {
  sidebarOpen = true;
  document.getElementById('bookmarkSidebar').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
  renderBookmarkList();
}

export function closeSidebar() {
  sidebarOpen = false;
  document.getElementById('bookmarkSidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}

export function renderBookmarkList() {
  const list = document.getElementById('bookmarkList');
  const bm = getBookmarks();

  if (!bm.length) {
    list.innerHTML = `
      <div class="bookmark-empty">
        <div class="bookmark-empty-icon">🔖</div>
        <p>No bookmarks yet.<br>Save articles to read later.</p>
      </div>`;
    return;
  }

  list.innerHTML = bm.map(b => `
    <div class="bookmark-item">
      <div class="bookmark-item-body">
        <a href="${b.url}" target="_blank" class="bookmark-item-title">${b.title}</a>
        <div class="bookmark-item-source">${b.source}</div>
      </div>
      <button class="bookmark-item-remove" data-url="${b.url}" title="Remove">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.bookmark-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeBookmark(btn.dataset.url);
      renderBookmarkList();
      updateCount();
      // Update card buttons in the grid
      document.querySelectorAll(`.card-bookmark-btn[data-url="${btn.dataset.url}"]`).forEach(
        cb => cb.classList.remove('bookmarked')
      );
    });
  });
}

export function updateCount() {
  const count = getBookmarks().length;
  const el = document.getElementById('bookmarkCount');
  el.textContent = count || '';
}
