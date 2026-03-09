-- Move the 2 orphan clicks from "Histórico recuperado" to V1 - Pré Form
UPDATE public.clicks 
SET variant_id = '402cfc4e-ecaf-43cc-bc18-be47275c39a8'
WHERE variant_id = 'ed29a18d-f4fa-45a8-b987-7386109105fa';

-- Delete daily_metrics for variants being removed
DELETE FROM public.daily_metrics WHERE variant_id IN (
  'ed29a18d-f4fa-45a8-b987-7386109105fa',
  'ad736e12-ce78-492c-b679-04da7d7398f8',
  '2051c7f2-0f2b-41e9-9c93-b8570a85838b',
  'bd43c0c4-7091-49fd-a0bd-0125ea75425d',
  'a35897ea-336c-4091-9a44-e574ffbb730b'
);

-- Delete the empty duplicates and histórico
DELETE FROM public.smartlink_variants WHERE id IN (
  'ed29a18d-f4fa-45a8-b987-7386109105fa',
  'ad736e12-ce78-492c-b679-04da7d7398f8',
  '2051c7f2-0f2b-41e9-9c93-b8570a85838b',
  'bd43c0c4-7091-49fd-a0bd-0125ea75425d',
  'a35897ea-336c-4091-9a44-e574ffbb730b'
);