// 화면 전환: 주소의 #/영역/하위경로 로 화면을 보여준다. 영역 사이에 선행 조건은 없다.
(function () {
  var ROUTES = ['home', 'wellliving', 'welldying', 'legacy', 'settings'];
  var BASE_TITLE = '오늘의 한걸음';

  function partsFromHash() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  }

  function render() {
    var parts = partsFromHash();
    var route = ROUTES.indexOf(parts[0]) === -1 ? 'home' : parts[0];
    var current = null;

    document.querySelectorAll('.screen').forEach(function (el) {
      var on = el.getAttribute('data-route') === route;
      el.hidden = !on;
      if (on) current = el;
    });

    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.getAttribute('data-tab') === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    document.title = route === 'home'
      ? BASE_TITLE
      : current.getAttribute('data-title') + ' · ' + BASE_TITLE;

    var view = OneStep.views && OneStep.views[route];
    if (view) {
      // 하위 화면을 가진 영역이 제목 포커스와 스크롤을 직접 처리한다.
      view(parts.slice(1));
      return;
    }

    window.scrollTo(0, 0);
    var heading = current.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
})();
