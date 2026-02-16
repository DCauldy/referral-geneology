# Ideas

Future feature ideas and enhancements for Trellis.

## Email Notifications

Send email notifications for key exchange events:
- New pending exchange received
- Exchange accepted/declined
- New message in exchange thread
- Exchange status updated (converted, lost, etc.)

## Exchange Follow-Up System

The "Notify me when they connect" and "Remind me to follow up" checkboxes on the Send Referral form save booleans to the database (`notify_on_connect`, `remind_follow_up` on `referral_exchanges`) but are not yet wired to any notification or scheduling infrastructure.

- **Notify on connect**: When the receiver accepts the exchange, email the sender automatically
- **Remind to follow up**: Schedule a reminder (e.g. 7 days after send) if no response, delivered via email or in-app notification
