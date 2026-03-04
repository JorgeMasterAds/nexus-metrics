
-- Clean existing bot clicks from the database
DELETE FROM public.clicks
WHERE lower(user_agent) LIKE '%facebookexternalhit%'
   OR lower(user_agent) LIKE '%meta-externalads%'
   OR lower(user_agent) LIKE '%whatsapp/%'
   OR lower(user_agent) LIKE '%telegrambot%'
   OR lower(user_agent) LIKE '%twitterbot%'
   OR lower(user_agent) LIKE '%linkedinbot%'
   OR lower(user_agent) LIKE '%googlebot%'
   OR lower(user_agent) LIKE '%adsbot-google%'
   OR lower(user_agent) LIKE '%bingbot%'
   OR lower(user_agent) LIKE '%slackbot%'
   OR lower(user_agent) LIKE '%discordbot%'
   OR lower(user_agent) LIKE '%semrushbot%'
   OR lower(user_agent) LIKE '%ahrefsbot%'
   OR lower(user_agent) LIKE '%facebookcatalog%';
