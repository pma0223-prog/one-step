// 내 데이터와 설정 화면: 글자 크기, 내보내기, 전체 삭제
(function () {
  var storage = OneStep.storage;
  var $ = function (id) { return document.getElementById(id); };

  var SIZES = ['normal', 'large', 'xlarge'];

  function validSize(size) {
    return SIZES.indexOf(size) === -1 ? 'normal' : size;
  }

  function applySize(size) {
    document.documentElement.setAttribute('data-size', validSize(size));
  }

  function currentSettings() {
    return storage.get('settings', {});
  }

  function saveSize(size) {
    var s = currentSettings();
    s.size = size;
    storage.set('settings', s);
    applySize(size);
  }

  function renderStatus() {
    $('storage-status').textContent = storage.isPersistent()
      ? '이 기기의 브라우저에 저장하고 있어요.'
      : '지금 브라우저에서는 저장할 수 없어서, 이 화면을 닫으면 기록이 사라져요. 내보내기로 파일을 남겨 두세요.';
  }

  function download(obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    a.href = url;
    a.download = 'onestep-backup-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var refreshReminder = null;

  function initReminders() {
    var R = OneStep.reminders;
    var enabled = $('rm-enabled');
    var options = $('rm-options');
    var time = $('rm-time');
    var system = $('rm-system');
    var chips = [].slice.call(document.querySelectorAll('#rm-days .chip'));

    function say(id, text) { $(id).textContent = text; }

    function render() {
      var c = R.getConfig();
      enabled.checked = c.enabled;
      options.hidden = !c.enabled;
      say('rm-state', c.enabled
        ? '켜져 있어요. 정한 시간 이후 앱을 열면 한 번 알려 드려요.'
        : '꺼져 있어요. 원할 때만 켜세요.');
      time.value = c.time;
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', c.days.indexOf(Number(chip.getAttribute('data-day'))) !== -1 ? 'true' : 'false');
      });
      var paused = R.isPaused(c);
      $('rm-resume').hidden = !paused;
      $('rm-pause-today').hidden = paused;
      $('rm-pause-week').hidden = paused;
      say('rm-pause-state', paused ? Number(c.pausedUntil.slice(5, 7)) + '월 ' + Number(c.pausedUntil.slice(8, 10)) + '일까지 쉬고 있어요.' : '쉬고 싶은 날은 알림을 잠시 멈출 수 있어요.');
      system.checked = c.browser && 'Notification' in window && Notification.permission === 'granted';
      say('rm-days-msg', '');
    }

    enabled.addEventListener('change', function () {
      R.update(function (c) { c.enabled = enabled.checked; });
      render();
    });

    time.addEventListener('change', function () {
      if (!time.value) { render(); return; }
      R.update(function (c) { c.time = time.value; });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var day = Number(chip.getAttribute('data-day'));
        var c = R.getConfig();
        var has = c.days.indexOf(day) !== -1;
        if (has && c.days.length === 1) {
          say('rm-days-msg', '요일을 하나는 남겨 주세요. 알림을 끄려면 위의 「알림 받기」를 꺼 주세요.');
          return;
        }
        R.update(function (x) {
          x.days = has ? x.days.filter(function (d) { return d !== day; }) : x.days.concat(day).sort();
        });
        render();
        chip.focus();
      });
    });

    $('rm-pause-today').addEventListener('click', function () {
      R.update(function (c) { c.pausedUntil = R.dayStr(0); });
      render();
      $('rm-resume').focus();
    });
    $('rm-pause-week').addEventListener('click', function () {
      R.update(function (c) { c.pausedUntil = R.dayStr(6); });
      render();
      $('rm-resume').focus();
    });
    $('rm-resume').addEventListener('click', function () {
      R.update(function (c) { c.pausedUntil = ''; });
      render();
    });

    system.addEventListener('change', function () {
      if (!system.checked) {
        R.update(function (c) { c.browser = false; });
        say('rm-system-msg', '기기 알림창은 끄고, 앱 안에서만 알려 드려요.');
        return;
      }
      R.requestSystem().then(function (result) {
        if (result === 'granted') {
          R.update(function (c) { c.browser = true; });
          say('rm-system-msg', '앱이 열려 있을 때 기기 알림창으로도 알려 드려요. 기기에 따라 안 뜰 수 있어요.');
        } else {
          system.checked = false;
          R.update(function (c) { c.browser = false; });
          say('rm-system-msg', result === 'unsupported'
            ? '이 기기와 브라우저에서는 기기 알림창을 쓸 수 없어요. 앱 안에서 알려 드려요.'
            : '기기 알림이 허용되지 않았어요. 브라우저 설정에서 허용하면 쓸 수 있어요.');
        }
      });
    });

    $('rm-ics').addEventListener('click', function () { R.downloadIcs(); });

    refreshReminder = render;
    render();
  }

  // 내보낸 파일 불러오기: 파일을 고르면 내용을 먼저 보여 주고, 내가 정한 방법으로만 가져온다.
  function initImport() {
    var backup = OneStep.backup;
    var file = $('imp-file');
    var preview = $('imp-preview');
    var pending = null;

    var MERGE_HELP = '지금 있는 기록은 그대로 두고, 없는 것만 더해요. 같은 기록은 한 번만 들어가요.';
    var REPLACE_HELP = '지금 있는 실천 계획·기록·답·유산은 지워지고 파일의 내용으로 바뀌어요.';

    function say(text) { $('imp-msg').textContent = text; }

    // 끝낼 때마다 안전한 「합치기」로 되돌려, 다음번에 실수로 기록을 바꾸지 않게 한다.
    function reset() {
      pending = null;
      preview.hidden = true;
      $('imp-confirm').hidden = true;
      $('imp-go').hidden = false;
      file.value = '';
      document.querySelector('input[name="imp-mode"][value="merge"]').checked = true;
      $('imp-mode-help').textContent = MERGE_HELP;
    }

    function run(mode) {
      var ok = backup.apply(pending.data, mode);
      reset();
      say(ok
        ? '불러왔어요. 「실천하기」, 「기록」, 「나의 이야기」에서 확인할 수 있어요.'
        : '일부를 저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요.');
    }

    function mode() {
      var checked = document.querySelector('input[name="imp-mode"]:checked');
      return checked ? checked.value : 'merge';
    }

    file.addEventListener('change', function () {
      say('');
      preview.hidden = true;
      pending = null;
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var result = backup.parse(String(reader.result));
        if (result.error) { say(result.error); return; }
        pending = result;
        $('imp-summary').textContent = '이 파일에는 ' + result.summary.join(', ') + '가 들어 있어요.' +
          (result.skipped ? ' 읽을 수 없는 항목 ' + result.skipped + '개는 건너뛰어요.' : '');
        preview.hidden = false;
      };
      reader.onerror = function () { say('파일을 읽지 못했어요. 다시 골라 주세요.'); };
      reader.readAsText(f);
    });

    document.querySelectorAll('input[name="imp-mode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        $('imp-mode-help').textContent = mode() === 'replace' ? REPLACE_HELP : MERGE_HELP;
      });
    });

    $('imp-go').addEventListener('click', function () {
      if (!pending) return;
      if (mode() === 'replace') {
        $('imp-confirm').hidden = false;
        $('imp-go').hidden = true;
        $('imp-confirm-no').focus();
        return;
      }
      run('merge');
    });

    $('imp-cancel').addEventListener('click', function () { reset(); say(''); file.focus(); });
    $('imp-confirm-no').addEventListener('click', function () {
      $('imp-confirm').hidden = true;
      $('imp-go').hidden = false;
      $('imp-go').focus();
    });
    $('imp-confirm-yes').addEventListener('click', function () { if (pending) run('replace'); });
  }

  function init() {
    var size = validSize(currentSettings().size);
    applySize(size);
    document.querySelectorAll('input[name="size"]').forEach(function (r) {
      r.checked = r.value === size;
      r.addEventListener('change', function () { if (r.checked) saveSize(r.value); });
    });

    $('btn-export').addEventListener('click', function () {
      if (!storage.hasData()) {
        $('export-msg').textContent = '아직 저장된 기록이 없어요. 기록을 남긴 뒤에 내보낼 수 있어요.';
        return;
      }
      download(storage.exportAll());
      $('export-msg').textContent = '파일을 저장했어요. 내려받은 파일은 내가 직접 보관해 주세요.';
    });

    $('btn-clear').addEventListener('click', function () {
      $('clear-confirm').hidden = false;
      $('btn-clear').hidden = true;
      $('clear-msg').textContent = '';
      $('btn-clear-cancel').focus();
    });

    $('btn-clear-cancel').addEventListener('click', function () {
      $('clear-confirm').hidden = true;
      $('btn-clear').hidden = false;
      $('btn-clear').focus();
    });

    $('btn-clear-yes').addEventListener('click', function () {
      storage.clearAll();
      applySize('normal');
      document.querySelectorAll('input[name="size"]').forEach(function (r) { r.checked = r.value === 'normal'; });
      $('clear-confirm').hidden = true;
      $('btn-clear').hidden = false;
      $('clear-msg').textContent = '모든 기록을 지웠어요.';
      if (refreshReminder) refreshReminder();
    });

    renderStatus();
    initReminders();
    initImport();
  }

  init();
})();
