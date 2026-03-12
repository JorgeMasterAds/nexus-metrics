/**
 * Nexus Metrics — Tracking Script v1
 * Captures UTMs, click IDs, persists in localStorage/cookie,
 * sends hit to server, and injects params into checkout links.
 */
(function () {
  "use strict";

  var TOKEN = window.NEXUS_TOKEN;
  if (!TOKEN) return;

  var STORAGE_KEY = "nexus_tracking";
  var TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  var API_URL = "https://fnpmuffrqrlofjvqytof.supabase.co/functions/v1/hit";

  var CHECKOUT_DOMAINS = [
    "pay.hotmart.com", "hotmart.com/product",
    "pay.kiwify.com.br", "kiwify.app",
    "cakto.com.br", "clkdmg.site",
    "eduzz.com", "nutror.com",
    "monetizze.com.br",
    "payt.me",
    "guru.com.br"
  ];

  // ── Helpers ──
  function getParam(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function generateClickId() {
    var ts = Date.now().toString(36);
    var rand = "";
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return "nx_" + ts + rand;
  }

  // ── Persistence ──
  function saveData(data) {
    data._ts = Date.now();
    var json = JSON.stringify(data);
    try { localStorage.setItem(STORAGE_KEY, json); } catch (e) {}
    try {
      var expires = new Date(Date.now() + TTL_MS).toUTCString();
      document.cookie = STORAGE_KEY + "=" + encodeURIComponent(json) + ";path=/;expires=" + expires + ";SameSite=Lax";
    } catch (e) {}
  }

  function loadData() {
    var data = null;
    // localStorage first
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = JSON.parse(raw);
        if (data._ts && Date.now() - data._ts > TTL_MS) {
          localStorage.removeItem(STORAGE_KEY);
          data = null;
        }
      }
    } catch (e) {}
    // Cookie fallback
    if (!data) {
      try {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
          var c = cookies[i].trim();
          if (c.indexOf(STORAGE_KEY + "=") === 0) {
            data = JSON.parse(decodeURIComponent(c.substring(STORAGE_KEY.length + 1)));
            break;
          }
        }
      } catch (e) {}
    }
    return data;
  }

  // ── Send hit ──
  function sendHit(data) {
    var payload = JSON.stringify({
      token: TOKEN,
      click_id: data.click_id,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      utm_conjunto: data.utm_conjunto,
      fbclid: data.fbclid,
      gclid: data.gclid,
      ttclid: data.ttclid,
      page_url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    // sendBeacon preferred
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(API_URL, blob)) return;
    }
    // fetch fallback
    if (window.fetch) {
      fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(function () {});
      return;
    }
    // XHR fallback
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_URL, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(payload);
    } catch (e) {}
  }

  // ── Checkout link injection ──
  function isCheckoutLink(href) {
    if (!href) return false;
    var lower = href.toLowerCase();
    for (var i = 0; i < CHECKOUT_DOMAINS.length; i++) {
      if (lower.indexOf(CHECKOUT_DOMAINS[i]) !== -1) return true;
    }
    if (lower.indexOf("checkout.") !== -1) return true;
    return false;
  }

  function cleanSrc(val) {
    if (!val) return "";
    return val.replace(/_/g, "-").replace(/[^a-zA-Z0-9\-]/g, "").substring(0, 30);
  }

  function injectParams(link, data) {
    try {
      var href = link.getAttribute("href");
      if (!href || !isCheckoutLink(href)) return;

      var url;
      try { url = new URL(href, window.location.origin); } catch (e) { return; }

      // Don't duplicate
      if (url.searchParams.has("xcod")) return;

      if (data.click_id) url.searchParams.set("xcod", data.click_id);
      if (data.utm_source) url.searchParams.set("src", cleanSrc(data.utm_source));
      if (data.utm_source) url.searchParams.set("utm_source", data.utm_source);
      if (data.utm_medium) url.searchParams.set("utm_medium", data.utm_medium);
      if (data.utm_campaign) url.searchParams.set("utm_campaign", data.utm_campaign);
      if (data.utm_content) url.searchParams.set("utm_content", data.utm_content);

      link.setAttribute("href", url.toString());
    } catch (e) {}
  }

  function processAllLinks(data) {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) injectParams(links[i], data);
  }

  // ── Main ──
  var utmSource = getParam("utm_source");
  var utmMedium = getParam("utm_medium");
  var utmCampaign = getParam("utm_campaign");
  var utmContent = getParam("utm_content");
  var utmTerm = getParam("utm_term");
  var utmConjunto = getParam("utm_conjunto");
  var fbclid = getParam("fbclid");
  var gclid = getParam("gclid");
  var ttclid = getParam("ttclid");
  var xcod = getParam("xcod");
  var src = getParam("src");

  var hasNewUtms = utmSource || fbclid || gclid || ttclid || xcod;
  var existing = loadData();

  var trackingData;
  if (hasNewUtms) {
    trackingData = {
      click_id: xcod || generateClickId(),
      utm_source: utmSource || src || "",
      utm_medium: utmMedium || "",
      utm_campaign: utmCampaign || "",
      utm_content: utmContent || "",
      utm_term: utmTerm || "",
      utm_conjunto: utmConjunto || "",
      fbclid: fbclid || "",
      gclid: gclid || "",
      ttclid: ttclid || ""
    };
    saveData(trackingData);
    sendHit(trackingData);
  } else if (existing) {
    trackingData = existing;
  } else {
    return; // No tracking data
  }

  // Inject into checkout links
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { processAllLinks(trackingData); });
  } else {
    processAllLinks(trackingData);
  }

  // MutationObserver for dynamic links (SPAs, popups)
  try {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType === 1) {
            if (node.tagName === "A") injectParams(node, trackingData);
            var innerLinks = node.querySelectorAll ? node.querySelectorAll("a[href]") : [];
            for (var k = 0; k < innerLinks.length; k++) injectParams(innerLinks[k], trackingData);
          }
        }
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
