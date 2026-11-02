// 화면 전환: 주소의 #/영역/하위경로 로 화면을 보여준다. 영역 사이에 선행 조건은 없다.
(function () {
  var ROUTES = ['home', 'wellliving', 'welldying', 'legacy', 'settings'];
  var BASE_TITLE = '오늘의 한걸음';

  function partsFromHash() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  }

  // 하단 메뉴: 홈 / 실천하기(웰리빙) / 기록(남긴 경험) / 나의 이야기(마음의 유산)
  // 웰다잉과 설정은 홈에서 들어가며, 하단 메뉴에서는 강조하지 않는다.
  function tabFor(route, parts) {
    if (route === 'home') return 'home';
    if (route === 'legacy') return 'story';
    if (route === 'wellliving') {
      return parts[1] === 'records' || parts[1] === 'record' ? 'records' : 'practice';
    }
    return '';
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

    var activeTab = tabFor(route, parts);
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.getAttribute('data-tab') === activeTab) a.setAttribute('aria-current', 'page');
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

  // 시작 화면: 방문마다 한 번만 보여 주고, 바로 특정 화면 주소로 들어오면 건너뛴다.
  function initSplash() {
    var splash = document.getElementById('splash');
    var start = document.getElementById('splash-start');
    if (!splash || !start) return;
    var inert = [document.getElementById('view'), document.querySelector('.tabbar')];

    function setInert(on) {
      inert.forEach(function (el) {
        if (!el) return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    function seen() {
      try { return sessionStorage.getItem('onestep:splash') === '1'; } catch (e) { return false; }
    }

    var deepLink = location.hash && location.hash !== '#' && location.hash !== '#/';
    if (seen() || deepLink) { splash.hidden = true; return; }

    setInert(true);
    start.focus();
    start.addEventListener('click', function () {
      try { sessionStorage.setItem('onestep:splash', '1'); } catch (e) { /* 저장할 수 없어도 계속 진행 */ }
      splash.classList.add('leaving');
      setInert(false);
      setTimeout(function () {
        splash.hidden = true;
        var heading = document.querySelector('.screen:not([hidden]) h1');
        if (heading) heading.focus({ preventScroll: true });
        if (OneStep.reminders) OneStep.reminders.check();
      }, 350);
    });
  }

  window.addEventListener('hashchange', render);
  render();
  initSplash();
})();
