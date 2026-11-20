/* Возврат на витрину без чтения contentDocument — работает и через file:// */
(function () {
  'use strict';
  if (window.parent === window) return;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var target = e.target && e.target.closest ? e.target : (e.target && e.target.parentElement);
    var link = target && target.closest ? target.closest('a[href="index.html"], a[href="site.html"]') : null;
    if (!link) return;
    e.preventDefault();
    try { window.parent.postMessage({ type: 'forma:return' }, '*'); } catch (err) {}
  }, true);
})();
