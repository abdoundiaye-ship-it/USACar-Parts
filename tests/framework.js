/* ============================================================
   Minimal Test Framework — USA PARTS AUTO ERP
   No dependencies. Runs in the browser.
   ============================================================ */

const TEST = (() => {
  let _suites = [];
  let _current = null;
  let _passed = 0;
  let _failed = 0;
  let _errors = [];

  function suite(name, fn) {
    _current = { name, tests: [] };
    _suites.push(_current);
    try { fn(); } catch (e) { _current.tests.push({ name: '(suite setup)', ok: false, msg: e.message }); }
  }

  function test(name, fn) {
    const t = { name, ok: false, msg: '' };
    if (_current) _current.tests.push(t);
    try {
      fn();
      t.ok = true;
      _passed++;
    } catch (e) {
      t.ok = false;
      t.msg = e.message;
      _failed++;
      _errors.push({ suite: _current?.name, test: name, msg: e.message });
    }
  }

  /* Async test: await TEST.testAsync(...) */
  async function testAsync(name, fn) {
    const t = { name, ok: false, msg: '' };
    if (_current) _current.tests.push(t);
    try {
      await fn();
      t.ok = true;
      _passed++;
    } catch (e) {
      t.ok = false;
      t.msg = e.message;
      _failed++;
      _errors.push({ suite: _current?.name, test: name, msg: e.message });
    }
  }

  /* Assertions */
  function assert(cond, msg = 'Assertion failed') {
    if (!cond) throw new Error(msg);
  }

  function eq(a, b, msg) {
    if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }

  function near(a, b, eps = 0.001, msg) {
    if (Math.abs(a - b) > eps) throw new Error(msg || `Expected ~${b}, got ${a}`);
  }

  function throws(fn, msg = 'Expected function to throw') {
    try { fn(); throw new Error(msg); } catch (e) { if (e.message === msg) throw e; }
  }

  /* Render results to DOM */
  function render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const total = _passed + _failed;
    const statusClass = _failed === 0 ? 'all-pass' : 'has-fail';

    let html = `
      <div class="summary ${statusClass}">
        <span class="summary-icon">${_failed === 0 ? '✅' : '❌'}</span>
        <strong>${_passed} / ${total} tests passés</strong>
        ${_failed > 0 ? `<span class="fail-count">${_failed} échec(s)</span>` : ''}
      </div>`;

    for (const s of _suites) {
      const sPass = s.tests.filter(t => t.ok).length;
      const sFail = s.tests.filter(t => !t.ok).length;
      html += `
        <div class="suite">
          <div class="suite-header ${sFail > 0 ? 'suite-fail' : 'suite-pass'}">
            ${sFail > 0 ? '❌' : '✅'} <strong>${s.name}</strong>
            <span class="suite-count">${sPass}/${s.tests.length}</span>
          </div>
          <ul class="test-list">
            ${s.tests.map(t => `
              <li class="test-item ${t.ok ? 'pass' : 'fail'}">
                <span class="test-icon">${t.ok ? '✓' : '✗'}</span>
                <span class="test-name">${t.name}</span>
                ${!t.ok ? `<span class="test-msg">${t.msg}</span>` : ''}
              </li>`).join('')}
          </ul>
        </div>`;
    }

    el.innerHTML = html;
  }

  function reset() {
    _suites = []; _current = null; _passed = 0; _failed = 0; _errors = [];
  }

  return { suite, test, testAsync, assert, eq, near, throws, render, reset, get passed() { return _passed; }, get failed() { return _failed; } };
})();
