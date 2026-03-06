
SELECT cron.schedule(
  'google-sync-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://fnpmuffrqrlofjvqytof.supabase.co/functions/v1/google-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucG11ZmZycXJsb2ZqdnF5dG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTAzNjQsImV4cCI6MjA4NzUyNjM2NH0.3veZ6OjXgYagq3YyrXrYPjZ18XAqwaj-09ZfYWV6o0A"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
