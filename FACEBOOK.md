# Facebook Webhooks Configuration

This document explains how to configure Facebook webhooks for all pages that your app is authorized to manage.

## Overview

Facebook webhooks allow your app to receive real-time notifications when events occur on Facebook Pages (comments, messages, reactions, etc.). Since your app manages multiple pages per user, you need to properly configure webhook subscriptions.

## Architecture

### App-Level Webhook
The webhook is configured at the **app level**, not per page. This means:
- One webhook endpoint handles events for ALL pages
- Facebook sends all page events to the same callback URL
- Your app differentiates between pages using the `page_id` in the webhook payload

### Page-Level Subscriptions
Each individual page must be subscribed to your app's webhook to receive events:
- Subscription happens when a user authorizes your app for their page
- Page access token is required for subscription
- Subscriptions persist until manually removed

## Setup Steps

### 1. Configure Webhook in App Dashboard

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to **Products** → **Webhooks**
4. Click **Configure Webhooks** for the **Page** object
5. Enter your webhook configuration:
   - **Callback URL**: `https://moderator.bedones.local/api/webhooks/facebook`
   - **Verify Token**: Create a secure random string and save it in your environment variables as `FACEBOOK_WEBHOOK_VERIFY_TOKEN`

6. Subscribe to the following fields (based on your app's features):
   - `feed` - **Posts AND comments** on the page (includes: status updates, photos, videos, links, comments, reactions, shares)
   - `mention` - When the page is @mentioned in posts or comments
   - `messages` - Page messages (Messenger inbox)
   - `messaging_postbacks` - Postback events from Messenger buttons
   - `message_reactions` - Reactions to Messenger messages
   - `message_echoes` - Messages sent by the page
   - `message_reads` - Message read status
   - `message_deliveries` - Message delivery confirmations

7. Click **Verify and Save**

### 2. Webhook Endpoint Implementation

Your webhook endpoint must handle two types of requests:

#### A. Verification Requests (GET)

Facebook sends a verification request to confirm your endpoint:

```
GET /api/webhooks/facebook?hub.mode=subscribe&hub.challenge=1234567890&hub.verify_token=YOUR_VERIFY_TOKEN
```

Response:
```javascript
if (req.query['hub.verify_token'] === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
  return res.status(200).send(req.query['hub.challenge']);
} else {
  return res.status(403).send('Forbidden');
}
```

#### B. Event Notifications (POST)

Facebook sends event notifications as POST requests:

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1458692752478,
      "changes": [
        {
          "field": "feed",
          "value": {
            "item": "comment",
            "comment_id": "123456789",
            "post_id": "987654321_123456789",
            "verb": "add",
            "message": "Comment text here"
          }
        }
      ]
    }
  ]
}
```

Your endpoint should:
1. Verify the signature (X-Hub-Signature-256 header)
2. Process the event based on the `entry[].id` (page ID)
3. Return `200 OK` immediately (process async if needed)
4. Complete processing within 20 seconds to avoid retries

### 3. Subscribe Individual Pages

When a user authorizes your app for their page(s), subscribe each page to your webhook:

**Endpoint**: `POST /{page-id}/subscribed_apps`

**Parameters**:
- `subscribed_fields`: Comma-separated list of fields to subscribe to (e.g., `feed,mention,messages`)
- `access_token`: Page access token

**Example**:
```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps" \
  -d "subscribed_fields=feed,mention,messages" \
  -d "access_token={PAGE_ACCESS_TOKEN}"
```

**Implementation in your app**:
```javascript
async function subscribePageToWebhook(pageId, pageAccessToken) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: 'feed,mention,messages,message_reactions',
        access_token: pageAccessToken,
      }),
    }
  );

  return await response.json();
}
```

### 4. Webhook Event Processing

Your webhook handler should:

1. **Identify the page**: Extract `entry[].id` to know which page the event is for
2. **Fetch page settings**: Load the page's moderation settings from your database
3. **Process based on settings**: Apply spam detection, FAQ responses, etc.
4. **Return quickly**: Always respond with `200 OK` within 20 seconds

## Best Practices

### Security
- ✅ Always verify the `X-Hub-Signature-256` header
- ✅ Use HTTPS for your webhook endpoint
- ✅ Store verify token securely in environment variables
- ✅ Validate all incoming data

### Performance
- ✅ Return `200 OK` immediately
- ✅ Process events asynchronously (queue/background job)
- ✅ Implement retry logic for failed processing
- ✅ Log all webhook events for debugging

### Reliability
- ✅ Handle duplicate events (Facebook may retry)
- ✅ Store processed event IDs to prevent duplicates
- ✅ Monitor webhook failures in App Dashboard
- ✅ Re-subscribe pages if subscriptions are lost

## Managing Multiple Pages

### During OAuth Flow
When a user connects their Facebook account:

1. Fetch all pages they manage via `/me/accounts`
2. Store page ID and access token for each page
3. **Subscribe each page** to your app's webhook
4. Save subscription status in your database

### Handling Webhook Events

```javascript
// Webhook payload contains all pages
{
  "object": "page",
  "entry": [
    { "id": "PAGE_1_ID", "changes": [...] },
    { "id": "PAGE_2_ID", "changes": [...] }
  ]
}

// Process each page separately
entry.forEach(pageEvent => {
  const pageId = pageEvent.id;
  const pageSettings = await getPageSettings(pageId);

  pageEvent.changes.forEach(change => {
    processEvent(pageId, change, pageSettings);
  });
});
```

## Testing

### Test with Facebook's Webhook Testing Tool
1. Go to App Dashboard → Webhooks
2. Click **Test** next to your Page subscription
3. Select an event type and click **Send to My Server**
4. Verify your endpoint receives and processes the test event

### Test Subscriptions
Check which pages are subscribed:

```bash
curl -X GET \
  "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps?access_token={PAGE_ACCESS_TOKEN}"
```

## Environment Variables

Add to your `.env` file:

```bash
# Facebook Webhook
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here
```

Generate a secure token:
```bash
openssl rand -base64 32
```

## Troubleshooting

### Webhook not receiving events
- ✅ Verify page subscription: `GET /{page-id}/subscribed_apps`
- ✅ Check webhook configuration in App Dashboard
- ✅ Review error logs in App Dashboard → Webhooks
- ✅ Ensure endpoint returns `200 OK` within 20 seconds
- ✅ Verify SSL certificate is valid

### Duplicate events
- ✅ Implement idempotency using event IDs
- ✅ Check for retry logic issues
- ✅ Ensure quick response times (< 20s)

### Missing permissions
- ✅ Verify app has required permissions in App Review
- ✅ Check page access token has not expired
- ✅ Confirm user granted necessary permissions during OAuth

## References

- [Facebook Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Page Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/reference/page)
- [Subscribed Apps Edge](https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps)
