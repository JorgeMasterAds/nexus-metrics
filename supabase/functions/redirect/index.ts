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

  // ── GET: redirect or return variants/json ──
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const accountId = url.searchParams.get('account_id');
  const domain = url.searchParams.get('domain')?.trim().toLowerCase();
  const mode = url.searchParams.get('mode');
  const noTrack = url.searchParams.get('no_track') === '1';

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
  const userAgent = req.headers.get('user-agent') || null;

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
  if (!noTrack) {
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
