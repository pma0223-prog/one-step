// 내보낸 파일 불러오기: 파일을 읽어 검사한 뒤, 지금 기록에 합치거나 바꾼다.
// 파일은 이 기기 안에서만 읽고 어디로도 보내지 않는다. 설정(글자 크기, 알림)은 가져오지 않는다.
(function (global) {
  var storage = OneStep.storage;
  var MAX_CHARS = 5 * 1024 * 1024;
  var LEGACY_TYPES = ['story', 'kept', 'letter'];
  var UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var STATUSES = ['planned', 'done', 'partial', 'hold', 'skipped'];

  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  // 날짜나 만든 시각이 없거나 잘못된 항목도 화면에서 사라지지 않게 안전한 값으로 채운다.
  function fixDates(x) {
    if (typeof x.date !== 'string' || !DATE_RE.test(x.date)) x.date = OneStep.ui.todayStr();
    if (typeof x.createdAt !== 'string') x.createdAt = new Date().toISOString();
    return x;
  }

  function fixPlan(x) {
    fixDates(x);
    if (STATUSES.indexOf(x.status) === -1) x.status = 'planned';
    if (typeof x.time !== 'string') x.time = '';
    if (typeof x.areaId !== 'string') x.areaId = '';
    return x;
  }

  function fixRecord(x) {
    fixDates(x);
    if (typeof x.areaId !== 'string') x.areaId = '';
    return x;
  }

  // id가 글자이고 필요한 칸이 글자인 항목만 남긴다.
  function cleanList(list, required) {
    var ok = [];
    var skipped = 0;
    (Array.isArray(list) ? list : []).forEach(function (x) {
      var valid = isObj(x) && typeof x.id === 'string' && x.id &&
        required.every(function (k) { return typeof x[k] === 'string'; });
      if (valid) ok.push(x); else skipped++;
    });
    return { ok: ok, skipped: skipped };
  }

  // 파일 내용을 검사해 {data, summary, skipped} 또는 {error}를 돌려준다.
  function parse(text) {
    if (typeof text !== 'string' || text.length > MAX_CHARS) return { error: '파일이 너무 커서 읽을 수 없어요.' };
    var obj;
    try { obj = JSON.parse(text); } catch (e) {
      return { error: '이 파일은 읽을 수 없어요. 「파일로 내보내기」로 만든 파일이 맞는지 확인해 주세요.' };
    }
    if (!isObj(obj) || obj.app !== 'one-step' || !isObj(obj.data)) {
      return { error: '오늘의 한걸음에서 내보낸 파일이 아니에요.' };
    }

    var src = obj.data;
    var data = {};
    var skipped = 0;
    var summary = [];

    if (src.plans !== undefined) {
      var p = cleanList(src.plans, ['text']);
      data.plans = p.ok.map(fixPlan); skipped += p.skipped;
      if (p.ok.length) summary.push('실천 계획 ' + p.ok.length + '개');
    }
    if (src.records !== undefined) {
      var r = cleanList(src.records, []);
      data.records = r.ok.map(fixRecord); skipped += r.skipped;
      if (r.ok.length) summary.push('경험 기록 ' + r.ok.length + '개');
    }
    if (isObj(src.legacy)) {
      var l = cleanList(src.legacy.entries, ['type']);
      var entries = l.ok.filter(function (e) { return LEGACY_TYPES.indexOf(e.type) !== -1; }).map(fixDates);
      skipped += l.skipped + (l.ok.length - entries.length);
      data.legacy = { entries: entries };
      if (entries.length) summary.push('마음의 유산 ' + entries.length + '개');
    }
    if (isObj(src.reflections)) {
      var ref = { answers: {}, checklist: [], discuss: { picked: [], custom: [] } };
      if (isObj(src.reflections.answers)) {
        Object.keys(src.reflections.answers).forEach(function (qid) {
          var a = src.reflections.answers[qid];
          if (UNSAFE_KEYS.indexOf(qid) === -1 && isObj(a) && typeof a.text === 'string') ref.answers[qid] = a; else skipped++;
        });
      }
      var c = cleanList(src.reflections.checklist, ['text']);
      ref.checklist = c.ok; skipped += c.skipped;
      var d = isObj(src.reflections.discuss) ? src.reflections.discuss : {};
      ref.discuss.picked = (Array.isArray(d.picked) ? d.picked : []).filter(function (x) { return typeof x === 'string'; });
      var dc = cleanList(d.custom, ['text']);
      ref.discuss.custom = dc.ok; skipped += dc.skipped;
      data.reflections = ref;
      var n = Object.keys(ref.answers).length + ref.checklist.length + ref.discuss.custom.length + ref.discuss.picked.length;
      if (n) summary.push('웰다잉 답과 목록 ' + n + '개');
    }

    if (!summary.length) return { error: '가져올 기록이 없는 파일이에요.' };
    return { data: data, summary: summary, skipped: skipped };
  }

  function mergeById(current, incoming) {
    var have = Object.create(null);
    current.forEach(function (x) { have[x.id] = true; });
    incoming.forEach(function (x) { if (!have[x.id]) { current.push(x); have[x.id] = true; } });
    return current;
  }

  function mergeReflections(cur, inc) {
    cur = isObj(cur) ? cur : {};
    cur.answers = isObj(cur.answers) ? cur.answers : {};
    cur.checklist = Array.isArray(cur.checklist) ? cur.checklist : [];
    cur.discuss = isObj(cur.discuss) ? cur.discuss : {};
    cur.discuss.picked = Array.isArray(cur.discuss.picked) ? cur.discuss.picked : [];
    cur.discuss.custom = Array.isArray(cur.discuss.custom) ? cur.discuss.custom : [];
    Object.keys(inc.answers).forEach(function (qid) {
      if (!Object.prototype.hasOwnProperty.call(cur.answers, qid)) cur.answers[qid] = inc.answers[qid];
    });
    mergeById(cur.checklist, inc.checklist);
    inc.discuss.picked.forEach(function (id) { if (cur.discuss.picked.indexOf(id) === -1) cur.discuss.picked.push(id); });
    mergeById(cur.discuss.custom, inc.discuss.custom);
    return cur;
  }

  // 모두 저장되면 true. mode: 'merge'(합치기) 또는 'replace'(바꾸기)
  function apply(data, mode) {
    var ok = true;
    function put(key, value) { if (!storage.set(key, value)) ok = false; }

    ['plans', 'records'].forEach(function (key) {
      if (data[key] === undefined) return;
      put(key, mode === 'replace' ? data[key] : mergeById(storage.get(key, []), data[key]));
    });
    if (data.legacy !== undefined) {
      var cur = storage.get('legacy', {});
      put('legacy', { entries: mode === 'replace' ? data.legacy.entries : mergeById(Array.isArray(cur.entries) ? cur.entries : [], data.legacy.entries) });
    }
    if (data.reflections !== undefined) {
      put('reflections', mode === 'replace' ? data.reflections : mergeReflections(storage.get('reflections', {}), data.reflections));
    }
    return ok;
  }

  global.OneStep = global.OneStep || {};
  global.OneStep.backup = { parse: parse, apply: apply };
})(window);
