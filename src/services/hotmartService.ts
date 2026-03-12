// Base URLs conforme documentação oficial da Hotmart:
// Auth:  https://api-sec-vlc.hotmart.com/security/oauth/token
// API:   https://developers.hotmart.com/payments/api/v1/

const HOTMART_AUTH_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token'
const HOTMART_API_URL = 'https://developers.hotmart.com/payments/api/v1'

export async function getHotmartToken(clientId: string, clientSecret: string, basicToken: string) {
  const response = await fetch(`${HOTMART_AUTH_URL}?grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicToken}`,
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  })
  const data = await response.json()
  return data.access_token as string
}

export async function fetchHotmartSalesHistory(
  accessToken: string,
  params: {
    start_date?: number
    end_date?: number
    transaction_status?: string
    max_results?: number
    page_token?: string
  } = {}
) {
  const query = new URLSearchParams()
  if (params.start_date) query.set('start_date', String(params.start_date))
  if (params.end_date) query.set('end_date', String(params.end_date))
  if (params.transaction_status) query.set('transaction_status', params.transaction_status)
  if (params.max_results) query.set('max_results', String(params.max_results))
  if (params.page_token) query.set('page_token', params.page_token)

  const response = await fetch(`${HOTMART_API_URL}/sales/history?${query}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) throw new Error(`Hotmart API error: ${response.status}`)
  return response.json()
}

export async function fetchHotmartSubscriptions(accessToken: string, status = 'ACTIVE') {
  const response = await fetch(
    `${HOTMART_API_URL}/subscriptions?status=${status}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  if (!response.ok) throw new Error(`Hotmart subscriptions error: ${response.status}`)
  return response.json()
}
