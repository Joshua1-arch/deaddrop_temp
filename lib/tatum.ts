import { TATUM_API_KEY } from './constants';

// Subscribe to notifications for a Sui object (publication)
export async function subscribeToUnlockNotification(
  objectId: string,
  webhookUrl: string
): Promise<{ id: string } | null> {
  if (!TATUM_API_KEY) {
    console.warn("[Tatum] TATUM_API_KEY not configured, skipping notification setup");
    return null;
  }

  try {
    const response = await fetch("https://api.tatum.io/v4/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TATUM_API_KEY
      },
      body: JSON.stringify({
        type: "ADDRESS_TRANSACTION",
        attr: {
          address: objectId,
          chain: "sui-testnet"
        },
        webhookUrl: webhookUrl
      })
    });
    
    if (!response.ok) {
      throw new Error(`Tatum API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('[Tatum] Subscription failed:', err);
    return null;
  }
}

// Get all active subscriptions
export async function getSubscriptions() {
  if (!TATUM_API_KEY) {
    return [];
  }

  try {
    const response = await fetch("https://api.tatum.io/v4/subscription?pageSize=10", {
      headers: {
        "x-api-key": TATUM_API_KEY
      }
    });
    if (response.ok) {
      const json = await response.json();
      return json || [];
    }
  } catch (err) {
    console.error('[Tatum] getSubscriptions failed:', err);
  }
  return [];
}
