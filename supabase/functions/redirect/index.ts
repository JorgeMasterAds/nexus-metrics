import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ── Bot / prefetch detection helper ──
  const BOT_UA_PATTERNS = [
    'facebookexternalhit', 'meta-externalads', 'facebookcatalog',
    'whatsapp', 'telegrambot', 'twitterbot', 'linkedinbot',
    'slackbot', 'discordbot', 'googlebot', 'adsbot-google',
    'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
    'applebot', 'semrushbot', 'ahrefsbot', 'mj12bot',
    'crawler', 'spider', 'bot/', 'preview',
    'curl/', 'wget/', 'python-requests', 'go-http-client',
    'java/', 'axios/', 'node-fetch', 'undici',
    // Headless / automation
    'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
    // Monitoring / uptime
    'pingdom', 'uptimerobot', 'statuscake', 'site24x7', 'newrelic',
    'datadog', 'gtmetrix', 'lighthouse',
    // Security scanners
    'nessus', 'qualys', 'sucuri', 'virustotal',
    // Link preview / unfurlers
    'embedly', 'quora link preview', 'outbrain', 'rogerbot',
    'showyoubot', 'pinterestbot', 'screaming frog',
    // HTTP libraries not caught above
    'httpie', 'okhttp', 'libwww-perl', 'ruby', 'scrapy',
  ];
  function isBot(ua: string | null): boolean {
    if (!ua) return true;
    const lower = ua.toLowerCase();
    return BOT_UA_PATTERNS.some(p => lower.includes(p));
  }
  function isPrefetch(req: Request): boolean {
    const purpose = req.headers.get('purpose') || req.headers.get('x-purpose') || '';
    const fetchMode = req.headers.get('sec-fetch-dest') || '';
    if (purpose.toLowerCase() === 'prefetch' || purpose.toLowerCase() === 'preview') return true;
    if (fetchMode === 'document' && req.headers.get('sec-fetch-user') !== '?1') return false;
    // Facebook/Instagram in-app prefetch sends specific headers
    const via = req.headers.get('x-fb-http-engine') || '';
    if (via) return true; // FB SDK prefetch
    return false;
  }

  // ── POST: log_click from Worker ──
  if (req.method === 'POST') {
    try {
      // Validate caller uses the correct apikey
      const apikey = req.headers.get('apikey') || req.headers.get('authorization')?.replace('Bearer ', '');
      const expectedKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (!apikey || apikey !== expectedKey) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const body = await req.json();
      if (body.action === 'log_click') {
        // Skip if no_track flag is set or bot user-agent
        const postUa = (body.user_agent || '').toLowerCase();
        const postIsBot = BOT_UA_PATTERNS.some(p => postUa.includes(p));
        if (body.no_track || postIsBot) {
          return new Response(JSON.stringify({ ok: true, skipped: true }), {
            status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        // Validate required fields
        if (!body.account_id || !body.smartlink_id || !body.variant_id || !body.click_id) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const clientIp = body.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
        let ipHash: string | null = null;
        if (clientIp) {
          const encoder = new TextEncoder();
          const data = encoder.encode(clientIp);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        const ua = (body.user_agent || '').toLowerCase();
        let deviceType = 'desktop';
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceType = 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceType = 'tablet';
        }

        // Deduplicate: same ip_hash + smartlink within 1 hour
        let skipDuplicate = false;
        if (ipHash && body.smartlink_id) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabase
            .from('clicks')
            .select('id')
            .eq('ip_hash', ipHash)
            .eq('smartlink_id', body.smartlink_id)
            .gte('created_at', oneHourAgo)
            .limit(1);
          if (existing && existing.length > 0) {
            skipDuplicate = true;
          }
        }

        if (skipDuplicate) {
          return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'duplicate_ip' }), {
            status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        await supabase.from('clicks').insert({
          account_id: body.account_id,
          project_id: body.project_id || null,
          smartlink_id: body.smartlink_id,
          variant_id: body.variant_id,
          click_id: body.click_id,
          utm_source: body.utm_source || null,
          utm_medium: body.utm_medium || null,
          utm_campaign: body.utm_campaign || null,
          utm_term: body.utm_term || null,
          utm_content: body.utm_content || null,
          referrer: body.referrer || null,
          ip: null,
          ip_hash: ipHash,
          user_agent: body.user_agent || null,
          device_type: deviceType,
          country: body.country || null,
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    } catch {
      return new Response('Bad request', { status: 400, headers: corsHeaders });
    }
  }

  // (bot detection already defined above)

  // ── GET: redirect or return variants/json ──
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const accountId = url.searchParams.get('account_id');
  const domain = url.searchParams.get('domain')?.trim().toLowerCase();
  const mode = url.searchParams.get('mode');
  const userAgent = req.headers.get('user-agent') || null;
  const noTrack = url.searchParams.get('no_track') === '1' || isBot(userAgent) || isPrefetch(req);

  if (!slug) {
    return new Response('Slug ausente', { status: 400, headers: corsHeaders });
  }

  // Resolve account scope
  let resolvedAccountId = accountId;
  if (!resolvedAccountId && domain) {
    const { data: domainRecord } = await supabase
      .from('custom_domains')
      .select('account_id')
      .eq('domain', domain)
      .eq('is_active', true)
      .eq('is_verified', true)
      .maybeSingle();
    resolvedAccountId = domainRecord?.account_id || null;
  }

  // Build query
  let query = supabase
    .from('smartlinks')
    .select('id, account_id, project_id, is_active')
    .eq('slug', slug)
    .eq('is_active', true);

  if (resolvedAccountId) {
    query = query.eq('account_id', resolvedAccountId);
  }

  const { data: smartLink, error: slError } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (slError || !smartLink) {
    return new Response('Smart Link não encontrado', { status: 404, headers: corsHeaders });
  }

  // Get active variants
  const { data: variants, error: vError } = await supabase
    .from('smartlink_variants')
    .select('id, url, weight')
    .eq('smartlink_id', smartLink.id)
    .eq('is_active', true);

  if (vError || !variants || variants.length === 0) {
    return new Response('Nenhuma variante ativa', { status: 404, headers: corsHeaders });
  }

  // ── mode=variants: return raw variants for Worker to cache ──
  if (mode === 'variants') {
    return new Response(JSON.stringify({
      variants: variants.map(v => ({ id: v.id, url: v.url, weight: v.weight })),
      meta: { id: smartLink.id, account_id: smartLink.account_id, project_id: smartLink.project_id },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
    });
  }

  // ── Weighted random selection ──
  const totalWeight = variants.reduce((sum: number, v: any) => sum + (v.weight || 1), 0);
  let random = Math.random() * totalWeight;
  let selectedVariant = variants[0];
  for (const v of variants) {
    random -= (v.weight || 1);
    if (random <= 0) {
      selectedVariant = v;
      break;
    }
  }

  // Generate click_id
  const clickId = crypto.randomUUID().replace(/-/g, '');

  // Extract UTMs and metadata
  const utmSource = url.searchParams.get('utm_source') || null;
  const utmMedium = url.searchParams.get('utm_medium') || null;
  const utmCampaign = url.searchParams.get('utm_campaign') || null;
  const utmTerm = url.searchParams.get('utm_term') || null;
  const utmContent = url.searchParams.get('utm_content') || null;
  const referrer = req.headers.get('referer') || null;
  // userAgent already declared above

  // Device detection
  let deviceType = 'desktop';
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') || null;
  const country = req.headers.get('cf-ipcountry') || null;

  // Hash IP for LGPD
  let ipHash: string | null = null;
  if (clientIp) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clientIp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Insert click (fire-and-forget with error logging) — skip if no_track
  // Deduplicate: same ip_hash + smartlink within 1 hour = skip (industry standard à la Dub.co)
  if (!noTrack) {
    let isDuplicate = false;
    if (ipHash) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('clicks')
        .select('id')
        .eq('ip_hash', ipHash)
        .eq('smartlink_id', smartLink.id)
        .gte('created_at', oneHourAgo)
        .limit(1);
      if (existing && existing.length > 0) {
        isDuplicate = true;
      }
    }

    if (!isDuplicate) {
      supabase.from('clicks').insert({
        account_id: smartLink.account_id,
        project_id: smartLink.project_id || null,
        smartlink_id: smartLink.id,
        variant_id: selectedVariant.id,
        click_id: clickId,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        referrer,
        ip: null,
        ip_hash: ipHash,
        user_agent: userAgent,
        device_type: deviceType,
        country,
      }).then(({ error }) => {
        if (error) console.error('Click insert failed:', error.message);
      });
    }
  }

  // Build redirect URL
  let destinationUrl: URL;
  try {
    destinationUrl = new URL(selectedVariant.url);
    if (!['http:', 'https:'].includes(destinationUrl.protocol)) {
      return new Response('Protocolo de URL inválido', { status: 400, headers: corsHeaders });
    }
    const hostname = destinationUrl.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.169.254'];
    if (blockedHosts.includes(hostname) || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      return new Response('Destino bloqueado', { status: 403, headers: corsHeaders });
    }
    const rawUrl = selectedVariant.url.trim().toLowerCase();
    if (rawUrl.startsWith('//') || rawUrl.startsWith('javascript:') || rawUrl.startsWith('data:')) {
      return new Response('URL inválida', { status: 400, headers: corsHeaders });
    }
  } catch {
    return new Response('URL de redirecionamento inválida', { status: 400, headers: corsHeaders });
  }

  // Forward UTMs
  if (utmSource) destinationUrl.searchParams.set('utm_source', utmSource);
  if (utmMedium) destinationUrl.searchParams.set('utm_medium', utmMedium);
  if (utmCampaign) destinationUrl.searchParams.set('utm_campaign', utmCampaign);
  if (utmContent) destinationUrl.searchParams.set('utm_content', utmContent);
  if (utmTerm) destinationUrl.searchParams.set('utm_term', utmTerm);

  destinationUrl.searchParams.set('click_id', clickId);
  destinationUrl.searchParams.set('sck', clickId);

  const finalUrl = destinationUrl.toString();

  // JSON mode: return URL for client-side redirect
  if (mode === 'json') {
    return new Response(JSON.stringify({ url: finalUrl, click_id: clickId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
    });
  }

  // ── WhatsApp deeplink fallback ──
  const isWhatsAppLink = destinationUrl.hostname.toLowerCase().includes('chat.whatsapp.com') ||
                         destinationUrl.hostname.toLowerCase().includes('wa.me') ||
                         destinationUrl.hostname.toLowerCase().includes('api.whatsapp.com');

  if (isWhatsAppLink && userAgent) {
    const uaLower = userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(uaLower);
    const isAndroid = /android/.test(uaLower);

    if (isIOS || isAndroid) {
      // Extract WhatsApp group invite code for intent-based deeplink
      const groupCode = destinationUrl.pathname.replace(/^\//, '');
      const intentUrl = isAndroid
        ? `intent://invite/${groupCode}#Intent;scheme=whatsapp;package=com.whatsapp;end`
        : finalUrl; // iOS universal links handle it natively

      const storeUrl = isAndroid
        ? 'https://play.google.com/store/apps/details?id=com.whatsapp'
        : 'https://apps.apple.com/app/whatsapp-messenger/id310633997';

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecionando…</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:#0a0a0a;color:#fff;text-align:center;padding:20px}
.c{max-width:360px}
.spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.15);
  border-top-color:#25D366;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
h2{font-size:18px;margin-bottom:8px;font-weight:600}
p{font-size:14px;color:rgba(255,255,255,.6);margin-bottom:20px}
a{display:inline-block;padding:12px 28px;background:#25D366;color:#fff;
  border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
  transition:opacity .2s}
a:hover{opacity:.85}
.store{margin-top:16px;font-size:13px;color:rgba(255,255,255,.4)}
.store a{background:transparent;padding:0;font-size:13px;color:rgba(255,255,255,.6);text-decoration:underline}
</style>
</head>
<body>
<div class="c">
  <div class="spinner"></div>
  <h2>Abrindo WhatsApp…</h2>
  <p>Se o app não abrir automaticamente, toque no botão abaixo.</p>
  <a id="btn" href="${finalUrl}">Abrir no WhatsApp</a>
  <div class="store">Não tem o WhatsApp? <a href="${storeUrl}">Baixar aqui</a></div>
</div>
<script>
(function(){
  var t=setTimeout(function(){},2500);
  ${isAndroid ? `
  // Android: try intent deeplink first
  var iframe=document.createElement('iframe');
  iframe.style.display='none';
  iframe.src="${intentUrl}";
  document.body.appendChild(iframe);
  // Also try universal link
  setTimeout(function(){window.location.href="${finalUrl}"},300);
  ` : `
  // iOS: universal link via top-level navigation
  window.location.href="${finalUrl}";
  `}
  // Fallback: if still on page after 2.5s, user likely doesn't have WhatsApp
  t=setTimeout(function(){
    document.querySelector('h2').textContent='WhatsApp não detectado';
    document.querySelector('p').textContent='Instale o WhatsApp para continuar.';
    document.getElementById('btn').href="${storeUrl}";
    document.getElementById('btn').textContent='Baixar WhatsApp';
  },2500);
  document.addEventListener('visibilitychange',function(){
    if(document.hidden)clearTimeout(t);
  });
})();
</script>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
        },
      });
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': finalUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      ...corsHeaders,
    },
  });
});
