// 알림: 기본은 꺼짐. 내가 켠 경우에만, 정한 요일·시간 이후 앱이 열려 있을 때 한 번 알려 준다.
// 알림 문구에는 건강·재산·관계 같은 내용을 넣지 않고, 하지 않아도 괜찮다고 안내한다.
// 앱을 닫은 상태의 정시 알림은 서버가 필요해서 하지 않는다. 대신 캘린더 파일(.ics)을 내보낸다.
(function (global) {
  var storage = OneStep.storage;
  var ui = OneStep.ui;
  var h = ui.h;

  var MESSAGE = '선택한 활동을 확인할 시간입니다.';
  var DEFAULTS = { enabled: false, time: '20:00', days: [0, 1, 2, 3, 4, 5, 6], pausedUntil: '', browser: false, lastShown: '' };
  var CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  function getConfig() {
    var r = storage.get('settings', {}).reminder || {};
    var c = {};
    Object.keys(DEFAULTS).forEach(function (k) { c[k] = r[k] === undefined ? DEFAULTS[k] : r[k]; });
    if (!Array.isArray(c.days) || !c.days.length) c.days = DEFAULTS.days.slice();
    return c;
  }

  function saveConfig(c) {
    var s = storage.get('settings', {});
    s.reminder = c;
    return storage.set('settings', s);
  }

  function nowHM() {
    var d = new Date();
    return ui.pad(d.getHours()) + ':' + ui.pad(d.getMinutes());
  }

  function dayStr(offset) {
    var d = new Date();
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
    return d.getFullYear() + '-' + ui.pad(d.getMonth() + 1) + '-' + ui.pad(d.getDate());
  }

  // 설정을 바꾸면, 이미 지난 시간의 알림이 바로 뜨지 않도록 오늘 분은 보낸 것으로 본다.
  function update(mutate) {
    var c = getConfig();
    mutate(c);
    c.lastShown = nowHM() >= c.time ? ui.todayStr() : '';
    saveConfig(c);
    return c;
  }

  function isPaused(c) {
    return !!c.pausedUntil && c.pausedUntil >= ui.todayStr();
  }

  // ---------- 앱 안 알림 ----------

  function removeBanner() {
    var old = document.getElementById('reminder-banner');
    if (old) old.remove();
  }

  function showBanner() {
    removeBanner();
    var banner = h('div', { id: 'reminder-banner', class: 'reminder', role: 'status' }, [
      h('p', { class: 'reminder-title', text: MESSAGE }),
      h('p', { class: 'small', text: '하지 않아도 괜찮아요. 내가 정한 만큼만 해요.' }),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn', href: '#/wellliving/plan', text: '확인하러 가기', on: { click: removeBanner } }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '오늘은 그만', on: { click: removeBanner } })
      ])
    ]);
    document.body.appendChild(banner);
  }

  function notifySystem() {
    if (!('Notification' in global) || Notification.permission !== 'granted') return;
    try {
      new Notification('오늘의 한걸음', { body: MESSAGE, tag: 'onestep-reminder' });
    } catch (e) { /* 이 기기에서는 시스템 알림을 만들 수 없으면 앱 안 알림만 쓴다 */ }
  }

  function check() {
    var c = getConfig();
    if (!c.enabled) return;
    var splash = document.getElementById('splash');
    if (splash && !splash.hidden) return;
    var now = new Date();
    if (c.days.indexOf(now.getDay()) === -1) return;
    if (isPaused(c)) return;
    if (c.lastShown === ui.todayStr()) return;
    if (nowHM() < c.time) return;
    c.lastShown = ui.todayStr();
    saveConfig(c);
    showBanner();
    if (c.browser) notifySystem();
  }

  // ---------- 기기 알림 권한 ----------

  function requestSystem() {
    if (!('Notification' in global) || !global.isSecureContext) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return Promise.resolve(Notification.requestPermission()).then(function (r) { return r; }).catch(function () { return 'denied'; });
  }

  // ---------- 캘린더 파일 ----------

  function buildIcs(c) {
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var i = 0; i < 7 && c.days.indexOf(start.getDay()) === -1; i++) {
      start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    }
    var t = c.time.split(':');
    var local = start.getFullYear() + ui.pad(start.getMonth() + 1) + ui.pad(start.getDate()) + 'T' + ui.pad(Number(t[0])) + ui.pad(Number(t[1])) + '00';
    var stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var byday = c.days.slice().sort().map(function (d) { return CODES[d]; }).join(',');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//one-step//KO',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:onestep-reminder@pma0223-prog.github.io',
      'DTSTAMP:' + stamp,
      'DTSTART:' + local,
      'DURATION:PT15M',
      'RRULE:FREQ=WEEKLY;BYDAY=' + byday,
      'SUMMARY:오늘의 한걸음',
      'DESCRIPTION:' + MESSAGE,
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + MESSAGE,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
      ''
    ].join('\r\n');
  }

  function downloadIcs() {
    ui.downloadFile('onestep-reminder.ics', buildIcs(getConfig()), 'text/calendar;charset=utf-8');
  }

  // 앱이 열려 있는 동안 주기적으로 확인한다.
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  check();

  global.OneStep = global.OneStep || {};
  global.OneStep.reminders = {
    MESSAGE: MESSAGE,
    getConfig: getConfig,
    update: update,
    isPaused: isPaused,
    dayStr: dayStr,
    check: check,
    requestSystem: requestSystem,
    buildIcs: buildIcs,
    downloadIcs: downloadIcs
  };
})(window);
