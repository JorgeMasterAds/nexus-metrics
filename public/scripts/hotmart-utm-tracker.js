/**
 * =============================================================
 * Hotmart UTM & Click ID Tracker v4
 * =============================================================
 * Captura UTMs e click_id da URL de entrada e, ao clicar em
 * links pay.hotmart.com, modifica a URL do checkout para incluir:
 *
 *   1. UTMs originais como parâmetros individuais (client-side analytics)
 *   2. xcod = click_id (retorna no webhook em tracking.external_code)
 *   3. src  = Base64 de todos os UTMs + click_id serializados
 *            (retorna no webhook em tracking.source_sck)
 *
 * Webhook da Hotmart retorna APENAS:
 *   - data.purchase.tracking.source_sck  ← valor do ?src=
 *   - data.purchase.tracking.external_code ← valor do ?xcod=
 *
 * Os parâmetros sck, sub1–sub5 NÃO são retornados pela Hotmart.
 *
 * Formato do src (antes do Base64):
 *   utm_source:ig|utm_medium:Instagram_Feed|click_id:abc123
 *
 * Decodificação no backend:
 *   atob(source_sck) → split('|') → split(':') → objeto de UTMs
 *
 * Uso: <script src="hotmart-utm-tracker.js"></script>
 * =============================================================
 */
(function () {
  'use strict';

  // ── Configuração ──────────────────────────────────────────
  var STORAGE_KEY = 'hotmart_tracking';

  // Chaves UTM que serão capturadas da URL
  var UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_conjunto'
  ];

  // Todas as chaves que serão incluídas no src codificado
  var ALL_KEYS = UTM_KEYS.concat(['click_id']);

  // ── Funções auxiliares ────────────────────────────────────

  /**
   * Sanitiza um valor removendo caracteres problemáticos em URLs.
   * Remove colchetes, #, & isolados. Substitui espaços por _.
   */
  function sanitize(value) {
    if (!value) return '';
    return value
      .replace(/[\[\]#]/g, '')        // remove [, ], #
      .replace(/&(?=[^a-zA-Z]|$)/g, '') // remove & isolados (não entidades HTML)
      .replace(/\s+/g, '_')           // espaços → underscore
      .replace(/_+/g, '_')            // colapsa underscores consecutivos
      .replace(/^_|_$/g, '');          // remove _ no início/fim
  }

  /**
   * Lê os parâmetros de busca da URL atual.
   */
  function getUrlParams() {
    var params = {};
    try {
      var search = window.location.search.substring(1);
      if (!search) return params;
      var pairs = search.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        var key = decodeURIComponent(kv[0]);
        var val = kv.length > 1 ? decodeURIComponent(kv[1]) : '';
        params[key] = val;
      }
    } catch (e) { /* URL parsing falhou, retorna vazio */ }
    return params;
  }

  /**
   * Salva dados de tracking no localStorage.
   */
  function storeData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage indisponível */ }
  }

  /**
   * Recupera dados de tracking do localStorage.
   */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Codifica os dados de tracking em Base64 no formato:
   * utm_source:valor|utm_medium:valor|click_id:valor
   * Omite campos vazios.
   */
  function encodeTrackingToBase64(data) {
    var parts = [];
    for (var i = 0; i < ALL_KEYS.length; i++) {
      var key = ALL_KEYS[i];
      var val = data[key];
      if (val) {
        parts.push(key + ':' + sanitize(val));
      }
    }
    if (parts.length === 0) return '';
    try {
      // Usa encodeURIComponent + unescape para suportar caracteres Unicode
      return btoa(unescape(encodeURIComponent(parts.join('|'))));
    } catch (e) {
      return btoa(parts.join('|'));
    }
  }

  /**
   * Verifica se uma URL é do checkout da Hotmart.
   */
  function isHotmartUrl(url) {
    try {
      var parsed = new URL(url);
      return parsed.hostname.indexOf('pay.hotmart.com') !== -1;
    } catch (e) {
      return false;
    }
  }

  /**
   * Encontra o elemento <a> mais próximo na árvore do DOM.
   * Suporta cliques em elementos filhos de <a> e <button>.
   */
  function findLinkElement(el) {
    while (el && el !== document.body) {
      if (el.tagName === 'A' && el.href) return el;
      // Botões podem ter onclick ou data-href; verificar href no botão
      if (el.tagName === 'BUTTON') {
        // Verifica se há um <a> pai do botão
        var parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.tagName === 'A' && parent.href) return parent;
          parent = parent.parentElement;
        }
        return null;
      }
      el = el.parentElement;
    }
    return null;
  }

  // ── 1. Captura e persiste dados de tracking da URL ────────
  try {
    var urlParams = getUrlParams();
    var stored = loadData(); // preserva dados anteriores
    var hasNew = false;

    // Captura UTMs
    for (var i = 0; i < UTM_KEYS.length; i++) {
      var key = UTM_KEYS[i];
      if (urlParams[key]) {
        stored[key] = urlParams[key];
        hasNew = true;
      }
    }

    // Captura click_id (com fallback para sck)
    if (urlParams['click_id']) {
      stored['click_id'] = urlParams['click_id'];
      hasNew = true;
    } else if (urlParams['sck'] && !stored['click_id']) {
      // Usa sck como fallback apenas se click_id não existir
      stored['click_id'] = urlParams['sck'];
      hasNew = true;
    }

    if (hasNew) {
      storeData(stored);
    }
  } catch (e) {
    // Falha na captura inicial não deve quebrar o site
  }

  // ── 2. Modifica links da Hotmart ao clicar ────────────────

  /**
   * Aplica os parâmetros de tracking a uma URL da Hotmart.
   * Retorna a URL modificada ou null se não for Hotmart.
   */
  function applyTracking(originalHref) {
    if (!isHotmartUrl(originalHref)) return null;

    var data = loadData();

    // Verifica se há dados para injetar
    var hasData = false;
    for (var k in data) {
      if (data[k]) { hasData = true; break; }
    }
    if (!hasData) return null;

    try {
      var url = new URL(originalHref);

      // ── 2a. Adiciona UTMs individuais (para analytics client-side) ──
      for (var j = 0; j < UTM_KEYS.length; j++) {
        var utmKey = UTM_KEYS[j];
        var utmVal = data[utmKey];
        if (!utmVal) continue;
        // Não sobrescreve parâmetros que já existam na URL original
        if (url.searchParams.has(utmKey)) continue;
        url.searchParams.set(utmKey, sanitize(utmVal));
      }

      // ── 2b. Adiciona xcod com o click_id ──────────────────
      // xcod retorna no webhook em data.purchase.tracking.external_code
      var clickId = data['click_id'];
      if (clickId && !url.searchParams.has('xcod')) {
        url.searchParams.set('xcod', clickId);
      }

      // ── 2c. Adiciona src com todos os dados em Base64 ─────
      // src retorna no webhook em data.purchase.tracking.source_sck
      if (!url.searchParams.has('src')) {
        var srcEncoded = encodeTrackingToBase64(data);
        if (srcEncoded) {
          url.searchParams.set('src', srcEncoded);
        }
      }

      return url.toString();
    } catch (e) {
      return null;
    }
  }

  // ── 3. Intercepta cliques com event delegation ────────────
  try {
    document.addEventListener('click', function (e) {
      try {
        var linkEl = findLinkElement(e.target);
        if (!linkEl || !linkEl.href) return;

        var newHref = applyTracking(linkEl.href);
        if (newHref) {
          linkEl.href = newHref;
        }
      } catch (err) {
        // Erro no handler de clique não deve impedir a navegação
      }
    }, true); // capture phase para agir antes de outros handlers
  } catch (e) {
    // Falha ao registrar listener não deve quebrar o site
  }

  // ── 4. MutationObserver para links dinâmicos ──────────────
  // Monitora o DOM para pré-processar links da Hotmart que
  // sejam adicionados dinamicamente (popups, modais, SPAs).
  try {
    if (typeof MutationObserver !== 'undefined') {
      /**
       * Processa um elemento: se for um <a> apontando para Hotmart,
       * aplica os parâmetros de tracking preventivamente.
       */
      function processElement(el) {
        if (!el || !el.querySelectorAll) return;

        // Processa o próprio elemento se for um <a>
        if (el.tagName === 'A' && el.href && isHotmartUrl(el.href)) {
          var newHref = applyTracking(el.href);
          if (newHref) el.href = newHref;
        }

        // Processa todos os <a> filhos
        var links = el.querySelectorAll('a[href*="pay.hotmart.com"]');
        for (var i = 0; i < links.length; i++) {
          var link = links[i];
          var modified = applyTracking(link.href);
          if (modified) link.href = modified;
        }
      }

      var observer = new MutationObserver(function (mutations) {
        try {
          for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
              if (added[j].nodeType === 1) { // ELEMENT_NODE
                processElement(added[j]);
              }
            }
          }
        } catch (e) { /* Erro no observer não deve quebrar o site */ }
      });

      // Inicia observação quando o DOM estiver pronto
      function startObserver() {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        // Processa links já existentes no momento da inicialização
        processElement(document.body);
      }

      if (document.body) {
        startObserver();
      } else {
        document.addEventListener('DOMContentLoaded', startObserver);
      }
    }
  } catch (e) {
    // MutationObserver não disponível ou falhou; o click handler
    // ainda funcionará como fallback
  }

})();
