/* Возврат на витрину без чтения contentDocument — работает и через file:// */
(function () {
  'use strict';
  if (window.parent === window) return;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var target = e.target && e.target.closest ? e.target : (e.target && e.target.parentElement);
    var link = target && target.closest ? target.closest('a[href]') : null;
    if (!link) return;
    var p = '';
    try { p = new URL(link.getAttribute('href') || '', location.href).pathname; } catch (err) { p = link.getAttribute('href') || ''; }
    var base = '/forma-landing-demo/';
    try { var sc = document.currentScript && document.currentScript.src; if (sc) { var bb = new URL('../..', sc).pathname; if (bb && bb !== '/') base = bb; } } catch (err) {}
    if (p !== base && p !== base + 'site/' && !/(^|\/)index\.html$/.test(p) && !/(^|\/)site\.html$/.test(p)) return;

    e.preventDefault();
    try { window.parent.postMessage({ type: 'forma:return' }, '*'); } catch (err) {}
  }, true);
})();
