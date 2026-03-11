/**
 * =============================================================
 * Hotmart UTM Tracker
 * =============================================================
 * Captura UTMs da URL e converte automaticamente para parâmetros
 * de rastreamento da Hotmart (src, sck, sub1–sub4) ao clicar em
 * links de checkout pay.hotmart.com.
 *
 * Uso: cole antes do </body> em qualquer página HTML:
 * <script src="hotmart-utm-tracker.js"></script>
 *
 * Mapeamento:
 *   utm_source   → src
 *   utm_campaign → sck
 *   utm_content  → sub1
 *   utm_medium   → sub2
 *   utm_term     → sub3
 *   utm_conjunto → sub4
 * =============================================================
 */
(function () {
  'use strict';

  // ── Configuração ──────────────────────────────────────────
  var STORAGE_KEY = 'hotmart_utms';

  var UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_conjunto'
  ];

  var MAPPING = {
    utm_source:   'src',
    utm_campaign: 'sck',
    utm_content:  'sub1',
    utm_medium:   'sub2',
    utm_term:     'sub3',
    utm_conjunto: 'sub4'
  };

  // ── Funções auxiliares ────────────────────────────────────

  /**
   * Sanitiza um valor removendo colchetes, espaços extras e
   * caracteres problemáticos em URLs. Substitui espaços por "_".
   */
  function sanitize(value) {
    if (!value) return '';
    return value
      .replace(/[\[\]]/g, '')       // remove colchetes
      .replace(/[^\w\-.,]/g, '_')   // troca caracteres especiais por _
      .replace(/_+/g, '_')          // colapsa underscores consecutivos
      .replace(/^_|_$/g, '');       // remove _ no início/fim
  }

  /**
   * Lê os parâmetros de busca da URL atual.
   */
  function getUrlParams() {
    var params = {};
    var search = window.location.search.substring(1);
    if (!search) return params;
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split('=');
      var key = decodeURIComponent(kv[0]);
      var val = kv.length > 1 ? decodeURIComponent(kv[1]) : '';
      params[key] = val;
    }
    return params;
  }

  /**
   * Salva UTMs no localStorage.
   */
  function storeUtms(utms) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
    } catch (e) { /* localStorage indisponível */ }
  }

  /**
   * Recupera UTMs do localStorage.
   */
  function loadUtms() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  // ── 1. Captura e armazena UTMs da URL ─────────────────────
  var urlParams = getUrlParams();
  var captured = loadUtms(); // preserva UTMs anteriores se não houver novos
  var hasNew = false;

  for (var i = 0; i < UTM_KEYS.length; i++) {
    var key = UTM_KEYS[i];
    if (urlParams[key]) {
      captured[key] = urlParams[key];
      hasNew = true;
    }
  }

  if (hasNew) {
    storeUtms(captured);
  }

  // ── 2. Intercepta cliques em links da Hotmart ────────────
  document.addEventListener('click', function (e) {
    // Percorre a árvore do DOM até encontrar um <a>
    var el = e.target;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    if (!el || !el.href) return;

    // Verifica se o destino é pay.hotmart.com
    try {
      var url = new URL(el.href);
      if (url.hostname.indexOf('pay.hotmart.com') === -1) return;
    } catch (err) {
      return; // URL inválida, ignora
    }

    // Lê UTMs armazenados
    var utms = loadUtms();
    var hasUtms = false;
    for (var k in utms) {
      if (utms[k]) { hasUtms = true; break; }
    }
    if (!hasUtms) return;

    // Aplica mapeamento sem sobrescrever parâmetros existentes
    for (var utmKey in MAPPING) {
      if (!MAPPING.hasOwnProperty(utmKey)) continue;
      var hotmartParam = MAPPING[utmKey];
      var value = utms[utmKey];
      if (!value) continue;
      // Não sobrescreve se já existir na URL
      if (url.searchParams.has(hotmartParam)) continue;
      url.searchParams.set(hotmartParam, sanitize(value));
    }

    // Atualiza o href do link para o usuário ser redirecionado
    el.href = url.toString();
  }, true); // capture phase para agir antes de outros handlers

})();
