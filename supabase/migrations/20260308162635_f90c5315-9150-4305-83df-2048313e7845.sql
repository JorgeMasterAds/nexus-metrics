WITH wl AS (
  SELECT DISTINCT ON (transaction_id)
    transaction_id,
    split_part(
      coalesce(
        raw_payload->>'checkout_url',
        raw_payload->>'checkoutUrl',
        raw_payload#>>'{data,checkout_url}',
        raw_payload#>>'{data,checkoutUrl}'
      ),
      '?',
      1
    ) AS checkout_base,
    coalesce(
      raw_payload->>'utm_campaign',
      raw_payload#>>'{data,utm_campaign}',
      raw_payload#>>'{data,trackingParameters,utm_campaign}',
      ''
    ) AS utm_campaign
  FROM public.webhook_logs
  WHERE account_id = '2aeb99f9-192b-433c-8913-b262916cf70a'
    AND transaction_id IS NOT NULL
  ORDER BY transaction_id, created_at DESC
)
UPDATE public.conversions c
SET
  project_id = '251f434c-1050-4f83-81da-8afa6906efa1',
  smartlink_id = CASE
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/dh5geus_712989' THEN '20f10c9e-8ab8-4697-a47c-d723f3688074'::uuid
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/3cttdpb_794272' THEN '4458290c-3f10-4eb9-8c99-ea1a041971a9'::uuid
    ELSE c.smartlink_id
  END,
  variant_id = CASE
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/dh5geus_712989' AND wl.utm_campaign ILIKE '%V4%'
      THEN 'fbdf24c4-84be-4cb4-a500-313d8259c603'::uuid
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/dh5geus_712989'
      THEN '2ee57efe-1ba1-4f1f-a3ee-1f5575927b01'::uuid
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/3cttdpb_794272' AND wl.utm_campaign ILIKE '%V4%'
      THEN '8750fda1-b379-4027-8f1b-9468aee9c531'::uuid
    WHEN wl.checkout_base = 'https://pay.cakto.com.br/3cttdpb_794272'
      THEN '75e6a4af-10f5-42b1-900c-2d5400012cf3'::uuid
    ELSE c.variant_id
  END
FROM wl
WHERE c.account_id = '2aeb99f9-192b-433c-8913-b262916cf70a'
  AND c.transaction_id = wl.transaction_id
  AND (c.project_id = '251f434c-1050-4f83-81da-8afa6906efa1' OR c.project_id IS NULL)
  AND c.smartlink_id IS NULL
  AND c.variant_id IS NULL
  AND wl.checkout_base IN (
    'https://pay.cakto.com.br/dh5geus_712989',
    'https://pay.cakto.com.br/3cttdpb_794272'
  );