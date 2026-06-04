const TATUM_ENDPOINT = 
  'https://sui-testnet.gateway.tatum.io';
const TATUM_API_KEY = 
  process.env.NEXT_PUBLIC_TATUM_API_KEY || '';

export async function POST(request: Request) {
  const body = await request.json();
  
  const response = await fetch(TATUM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TATUM_API_KEY && {
        'x-api-key': TATUM_API_KEY
      }),
    },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  return Response.json(data);
}
