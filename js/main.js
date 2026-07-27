// ============ Duarte Legal Ensenada ============

// ---- Scroll reveals ----
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

// ---- Calculadora de viabilidad con IA ----
(function () {
  var textarea = document.getElementById('case-text');
  var analyzeBtn = document.getElementById('analyze-btn');
  var resetBtn = document.getElementById('reset-btn');
  var statusLabel = document.getElementById('status-label');
  var errorBox = document.getElementById('diag-error');
  var formView = document.getElementById('diag-form');
  var resultView = document.getElementById('diag-result');
  var analyzing = false;

  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      textarea.value = chip.getAttribute('data-chip');
      textarea.focus();
      hideError();
    });
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function hideError() {
    errorBox.hidden = true;
  }

  analyzeBtn.addEventListener('click', analyze);
  resetBtn.addEventListener('click', function () {
    resultView.hidden = true;
    formView.hidden = false;
    textarea.value = '';
    hideError();
  });

  async function analyze() {
    if (analyzing) return;
    var text = textarea.value.trim();
    if (text.length < 30) {
      showError('Cuéntenos un poco más — necesitamos al menos un par de frases para analizar su caso.');
      return;
    }
    hideError();
    analyzing = true;
    analyzeBtn.textContent = 'ANALIZANDO…';
    statusLabel.textContent = 'La IA está leyendo su caso…';

    try {
      var res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caso: text })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      renderResult(data);
    } catch (e) {
      showError('No pudimos completar el análisis en este momento. Intente de nuevo, o escríbanos directamente por WhatsApp.');
    } finally {
      analyzing = false;
      analyzeBtn.textContent = 'ANALIZAR MI CASO';
      statusLabel.textContent = 'IA lista para analizar · confidencial';
    }
  }

  function renderResult(data) {
    var v = Math.max(5, Math.min(95, Math.round(Number(data.viabilidad) || 50)));

    document.getElementById('result-title').textContent = data.titulo || 'Análisis preliminar';
    document.getElementById('result-badge').textContent =
      v >= 70 ? 'PERSPECTIVA FAVORABLE' :
      v >= 45 ? 'CASO CON POTENCIAL — REQUIERE ESTRATEGIA' :
      'CASO COMPLEJO — EVALUAR OPCIONES';
    document.getElementById('result-summary').textContent = data.resumen || '';
    document.getElementById('result-next').textContent =
      data.siguiente_paso || 'Agende una cita estratégica para revisar su caso a fondo.';

    var factorsEl = document.getElementById('result-factors');
    factorsEl.textContent = '';
    (Array.isArray(data.factores) ? data.factores.slice(0, 4) : []).forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'factor';
      var d = document.createElement('span');
      d.className = 'diamond';
      d.textContent = '◆';
      var t = document.createElement('span');
      t.textContent = String(f);
      row.appendChild(d);
      row.appendChild(t);
      factorsEl.appendChild(row);
    });

    formView.hidden = true;
    resultView.hidden = false;

    // gauge animation
    var C = 2 * Math.PI * 42;
    var arc = document.getElementById('gauge-arc');
    var label = document.getElementById('gauge-text');
    arc.setAttribute('stroke-dashoffset', String(C));
    label.textContent = '0%';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        arc.setAttribute('stroke-dashoffset', String(C * (1 - v / 100)));
      });
    });
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 1400);
      var eased = 1 - Math.pow(1 - p, 3);
      label.textContent = Math.round(v * eased) + '%';
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
