// 기록 저장의 유일한 창구. 브라우저 저장소(localStorage)만 쓰고 서버로 보내지 않는다.
// 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 메모리에 둔다.
(function (global) {
  var PREFIX = 'onestep:';
  var KEYS = ['settings', 'plans', 'records', 'reflections', 'legacy'];
  var memory = {};
  var persistent = probe();

  function probe() {
    try {
      var t = PREFIX + '__probe';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  function check(key) {
    if (KEYS.indexOf(key) === -1) throw new Error('알 수 없는 저장 항목: ' + key);
  }

  function get(key, fallback) {
    check(key);
    var raw = persistent ? safeRead(key) : memory[key];
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function safeRead(key) {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch (e) {
      return null;
    }
  }

  // 저장에 성공하면 true, 실패(용량 초과 등)하면 false
  function set(key, value) {
    check(key);
    var raw = JSON.stringify(value);
    if (!persistent) {
      memory[key] = raw;
      return true;
    }
    try {
      localStorage.setItem(PREFIX + key, raw);
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    check(key);
    delete memory[key];
    if (!persistent) return;
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) { /* 지울 수 없으면 무시 */ }
  }

  function clearAll() {
    KEYS.forEach(remove);
  }

  function exportAll() {
    var data = {};
    KEYS.forEach(function (k) {
      var v = get(k, undefined);
      if (v !== undefined) data[k] = v;
    });
    return {
      app: 'one-step',
      format: 1,
      exportedAt: new Date().toISOString(),
      data: data
    };
  }

  function hasData() {
    return KEYS.some(function (k) { return get(k, undefined) !== undefined; });
  }

  global.OneStep = global.OneStep || {};
  global.OneStep.storage = {
    KEYS: KEYS,
    get: get,
    set: set,
    remove: remove,
    clearAll: clearAll,
    exportAll: exportAll,
    hasData: hasData,
    isPersistent: function () { return persistent; }
  };
})(window);
