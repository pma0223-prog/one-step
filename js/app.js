// 화면 전환: 주소의 #/영역 값으로 화면을 보여준다. 영역 사이에 선행 조건은 없다.
(function () {
  var ROUTES = ['home', 'wellliving', 'welldying', 'legacy'];
  var BASE_TITLE = '오늘의 한걸음';

  function routeFromHash() {
    var name = location.hash.replace(/^#\/?/, '');
    return ROUTES.indexOf(name) === -1 ? 'home' : name;
  }

  function render() {
    var route = routeFromHash();
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

    window.scrollTo(0, 0);
    var heading = current.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
})();
