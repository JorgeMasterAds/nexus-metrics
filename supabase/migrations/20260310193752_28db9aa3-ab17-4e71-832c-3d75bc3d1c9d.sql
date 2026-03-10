-- Fix platform for Hotmart test webhooks incorrectly identified as cakto
UPDATE webhook_logs 
SET platform = 'hotmart'
WHERE id IN (
  'b40c6b5c-6d50-4653-bde5-4ca4cbf29212',
  '858c6abe-ef44-46fc-b0d9-984e3bdeda3b',
  '975b56f6-cf2a-45cb-a9bc-43afadd69417',
  '8a3bf18c-f510-4601-85e5-dbee15a361ab',
  '55484b2c-b209-45a4-81d5-24a5372da5fd',
  '0602dc60-f9ce-4c1b-a7bc-71bba98d70f7',
  '81168977-7548-481f-b69b-e928df7d0865',
  '7a4540fd-5ea6-4f0f-b22e-aba711826eb7',
  'f638ae80-033a-4877-953f-9218bbac1a96',
  'f5374c19-5f9e-404c-83a2-fbc37a93411d',
  'c7c31cda-9ad1-4cc1-807c-7488aa16f7c7'
);

-- Delete any conversions created from the test transaction
DELETE FROM conversions WHERE transaction_id = 'HP16015479281022';