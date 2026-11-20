/* ============================================================
   Витрина → просмотр: открывает лендинг поверх витрины,
   внутри него можно листать, есть возврат и переключение.
   ============================================================ */
(function () {
  'use strict';

  var PAGES = {
    nexus: { src: 'aurora.html', label: 'Nexus', accent: '#9a8bff' },
    vita:  { src: 'studio.html', label: 'Vita',  accent: '#ff7043' },
    orbit: { src: 'lumen.html',  label: 'Orbit', accent: '#6ee7d5' }
  };
  var ORDER = ['nexus', 'vita', 'orbit'];

  var viewer = document.createElement('div');
  viewer.className = 'viewer';
  viewer.id = 'viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Просмотр лендинга');
  viewer.setAttribute('aria-hidden', 'true');
  viewer.innerHTML =
    '<iframe class="viewer__frame" id="viewerFrame" title="Лендинг"></iframe>' +
    '<p class="viewer__hint" id="viewerHint">Листайте внутри — возврат внизу</p>' +
    '<nav class="viewer__dock" aria-label="Управление просмотром">' +
      '<button class="viewer__btn viewer__btn--back" type="button" data-act="close">← Витрина</button>' +
      '<span class="viewer__sep" aria-hidden="true"></span>' +
      '<button class="viewer__btn viewer__btn--icon" type="button" data-act="prev" aria-label="Предыдущий лендинг">‹</button>' +
      '<span class="viewer__name" id="viewerName"><i aria-hidden="true"></i><span></span></span>' +
      '<button class="viewer__btn viewer__btn--icon" type="button" data-act="next" aria-label="Следующий лендинг">›</button>' +
      '<span class="viewer__sep" aria-hidden="true"></span>' +
      '<a class="viewer__btn viewer__btn--open" id="viewerOpen" href="#" target="_blank" rel="noopener">↗</a>' +
    '</nav>';
  document.body.appendChild(viewer);

  // Постоянный переключатель проектов на витрине
  var projectDock = document.createElement('nav');
  projectDock.className = 'project-dock';
  projectDock.setAttribute('aria-label', 'Переключение проектов');
  projectDock.innerHTML = '<span class="project-dock__label">Проекты</span>' + ORDER.map(function (key) {
    return '<button class="viewer__btn" type="button" data-goto="' + key + '">' + PAGES[key].label + '</button>';
  }).join('');
  document.body.appendChild(projectDock);

  var frame = viewer.querySelector('#viewerFrame');
  var nameEl = viewer.querySelector('#viewerName');
  var nameText = nameEl.querySelector('span');
  var openLink = viewer.querySelector('#viewerOpen');
  var hint = viewer.querySelector('#viewerHint');
  var closeBtn = viewer.querySelector('[data-act="close"]');

  var current = null;
  var closeTimer = null;
  var lastFocus = null;

  function stopHub() {
    document.documentElement.classList.add('viewer-open');
    if (window.FORMA_LENIS && typeof window.FORMA_LENIS.stop === 'function') {
      window.FORMA_LENIS.stop();
    }
  }
  function startHub() {
    document.documentElement.classList.remove('viewer-open');
    if (window.FORMA_LENIS && typeof window.FORMA_LENIS.start === 'function') {
      window.FORMA_LENIS.start();
    }
  }

  function open(key) {
    if (!PAGES[key]) return;
    var page = PAGES[key];

    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

    if (current !== key) {
      viewer.classList.add('is-loading');
      frame.src = page.src;
      current = key;
    }

    nameText.textContent = page.label;
    nameEl.style.setProperty('--accent', page.accent);
    frame.title = 'Лендинг ' + page.label;
    openLink.href = page.src;
    viewer.setAttribute('aria-hidden', 'false');
    viewer.classList.add('is-open');
    stopHub();
    window.setTimeout(function () { try { closeBtn.focus(); } catch (e) {} }, 80);

    var index = ORDER.indexOf(key);
    viewer.querySelector('[data-act="prev"]').setAttribute('aria-label',
      'Предыдущий лендинг: ' + PAGES[ORDER[(index - 1 + ORDER.length) % ORDER.length]].label);
    viewer.querySelector('[data-act="next"]').setAttribute('aria-label',
      'Следующий лендинг: ' + PAGES[ORDER[(index + 1) % ORDER.length]].label);

    if (!sessionStorage.getItem('forma-viewer-hint')) {
      hint.classList.add('is-visible');
      sessionStorage.setItem('forma-viewer-hint', '1');
      window.setTimeout(function () { hint.classList.remove('is-visible'); }, 3800);
    }
  }

  function close() {
    if (!current && !viewer.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    startHub();
    var shown = current;
    current = null;
    closeTimer = window.setTimeout(function () {
      if (!current) frame.src = 'about:blank';
      closeTimer = null;
    }, 620);
    if (shown && lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  function closeAndClearHash() {
    // Сначала закрываем — даже если очистка якоря запрещена (например, file://)
    close();
    try {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {
      try { location.hash = ''; } catch (e2) {}
    }
  }

  function render() {
    var key = location.hash.replace(/^#/, '');
    if (PAGES[key]) open(key);
    else close();
  }

  // Клики по карточкам витрины → вход в лендинг
  document.querySelectorAll('.project__link[data-view]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var key = link.getAttribute('data-view');
      if (!PAGES[key]) return;
      e.preventDefault();
      lastFocus = link;
      if (location.hash.replace(/^#/, '') === key) render();
      else location.hash = key;
    });
  });

  // Переключатель на витрине
  projectDock.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-goto');
      lastFocus = btn;
      if (location.hash.replace(/^#/, '') === key) render();
      else location.hash = key;
    });
  });

  // Кнопки панели просмотра
  viewer.querySelectorAll('[data-act]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var act = btn.getAttribute('data-act');
      if (act === 'close') { closeAndClearHash(); return; }
      var i = ORDER.indexOf(current);
      if (i < 0) i = 0;
      var next = ORDER[(i + (act === 'next' ? 1 : -1) + ORDER.length) % ORDER.length];
      location.hash = next;
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) closeAndClearHash();
  });

  frame.addEventListener('load', function () {
    viewer.classList.remove('is-loading');
    try {
      var path = frame.contentWindow.location.pathname;
      // Ссылки «все работы» внутри лендинга возвращают на витрину
      if (/(^|\/)(index|site)\.html$/.test(path)) { closeAndClearHash(); return; }
      frame.contentWindow.scrollTo(0, 0);
    } catch (e) {}
  });

  // Возврат из лендинга (в том числе при открытии через file://)
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'forma:return' && current) closeAndClearHash();
  });

  window.addEventListener('hashchange', render);
  render();
})();
