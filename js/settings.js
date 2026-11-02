// 내 데이터와 설정 화면: 글자 크기, 내보내기, 전체 삭제
(function () {
  var storage = OneStep.storage;
  var $ = function (id) { return document.getElementById(id); };

  function applySize(size) {
    document.documentElement.setAttribute('data-size', size === 'large' ? 'large' : 'normal');
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

  function init() {
    var size = currentSettings().size === 'large' ? 'large' : 'normal';
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
    });

    renderStatus();
  }

  init();
})();
