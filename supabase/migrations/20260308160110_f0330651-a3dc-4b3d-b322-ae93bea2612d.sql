begin;

-- =========================
-- RECOVERY: VTDW (R$26)
-- histórico variant -> active variants by UTM marker
-- =========================

-- Clicks
update public.clicks
set variant_id = '2ee57efe-1ba1-4f1f-a3ee-1f5575927b01' -- V2 - No Form
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c'
  and upper(coalesce(utm_campaign, '')) like '%V2%';

update public.clicks
set variant_id = 'fbdf24c4-84be-4cb4-a500-313d8259c603' -- V3 - No Form - Promessa Direta
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c'
  and upper(coalesce(utm_campaign, '')) like '%V4%';

-- Fallback dos sem marcador: vai para V2 (maior volume detectado)
update public.clicks
set variant_id = '2ee57efe-1ba1-4f1f-a3ee-1f5575927b01'
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c'
  and upper(coalesce(utm_campaign, '')) not like '%V2%'
  and upper(coalesce(utm_campaign, '')) not like '%V4%';

-- Conversions
update public.conversions
set variant_id = '2ee57efe-1ba1-4f1f-a3ee-1f5575927b01'
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c'
  and upper(coalesce(raw_payload->'data'->>'utm_campaign', '')) like '%V2%';

update public.conversions
set variant_id = 'fbdf24c4-84be-4cb4-a500-313d8259c603'
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c'
  and (
    upper(coalesce(raw_payload->'data'->>'utm_campaign', '')) like '%V4%'
    or lower(coalesce(raw_payload->'data'->>'checkoutUrl', '')) like '%desafio-wp-v3%'
  );

-- Fallback conversões sem marcador
update public.conversions
set variant_id = '2ee57efe-1ba1-4f1f-a3ee-1f5575927b01'
where variant_id = 'f0d22068-b12b-4bd2-9093-66cdcd2de82c';


-- =========================
-- RECOVERY: VTDW R$35
-- histórico variant -> active variants by UTM marker / checkoutUrl
-- =========================

-- Clicks
update public.clicks
set variant_id = '75e6a4af-10f5-42b1-900c-2d5400012cf3' -- V1 - R$35 (url v3p)
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02'
  and upper(coalesce(utm_campaign, '')) like '%V3%';

update public.clicks
set variant_id = '8750fda1-b379-4027-8f1b-9468aee9c531' -- V2 - R$35 (url v4p)
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02'
  and upper(coalesce(utm_campaign, '')) like '%V4%';

-- Fallback dos sem marcador: vai para V1-R$35 (predominante)
update public.clicks
set variant_id = '75e6a4af-10f5-42b1-900c-2d5400012cf3'
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02'
  and upper(coalesce(utm_campaign, '')) not like '%V3%'
  and upper(coalesce(utm_campaign, '')) not like '%V4%';

-- Conversions
update public.conversions
set variant_id = '75e6a4af-10f5-42b1-900c-2d5400012cf3'
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02'
  and (
    upper(coalesce(raw_payload->'data'->>'utm_campaign', '')) like '%V3%'
    or lower(coalesce(raw_payload->'data'->>'checkoutUrl', '')) like '%v3p%'
  );

update public.conversions
set variant_id = '8750fda1-b379-4027-8f1b-9468aee9c531'
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02'
  and (
    upper(coalesce(raw_payload->'data'->>'utm_campaign', '')) like '%V4%'
    or lower(coalesce(raw_payload->'data'->>'checkoutUrl', '')) like '%v4p%'
  );

-- Fallback conversões sem marcador
update public.conversions
set variant_id = '75e6a4af-10f5-42b1-900c-2d5400012cf3'
where variant_id = '6ee0b952-3c4f-4233-8a90-90bb76563b02';


-- Remove variantes "Histórico recuperado" desses 2 smartlinks após reatribuição
delete from public.smartlink_variants
where id in (
  'f0d22068-b12b-4bd2-9093-66cdcd2de82c',
  '6ee0b952-3c4f-4233-8a90-90bb76563b02'
);

commit;