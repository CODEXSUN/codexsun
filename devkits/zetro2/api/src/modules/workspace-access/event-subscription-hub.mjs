// Authorized Event Subscription Hub
// Manages real-time event subscriptions (SSE / WebSocket) authorized by server-resolved membership

import { randomUUID } from 'node:crypto';

export class EventSubscriptionHub {
  #guard;
  #subscriptions = new Map(); // subId -> { channel, actorId, sessionId, listener }

  constructor({ guard }) {
    this.#guard = guard;
  }

  // Subscribe to a channel with server-enforced authorization
  async subscribe({ token, channel, listener }) {
    if (typeof listener !== 'function') {
      throw new Error('Listener callback must be a function');
    }

    const auth = await this.#guard.authorizeSubscription(token, channel);

    const subscriptionId = `sub-${randomUUID()}`;
    const entry = {
      id: subscriptionId,
      channel,
      actorId: auth.actorId || null,
      sessionId: auth.sessionId || null,
      workspaceId: auth.workspaceId || null,
      listener,
      createdAt: Date.now(),
    };

    this.#subscriptions.set(subscriptionId, entry);

    return {
      subscriptionId,
      channel,
      actorId: auth.actorId,
      unsubscribe: () => {
        this.#subscriptions.delete(subscriptionId);
      },
    };
  }

  // Publish event to subscribers of a channel
  publish(channel, payload) {
    let deliveredCount = 0;
    for (const [id, sub] of this.#subscriptions.entries()) {
      if (sub.channel === channel) {
        try {
          sub.listener(payload);
          deliveredCount++;
        } catch (err) {
          // Avoid subscriber callback failure affecting other listeners
          console.error(`Error in event listener for subscription ${id}:`, err);
        }
      }
    }
    return deliveredCount;
  }

  // Revoke all subscriptions associated with an expired or revoked session
  revokeSubscriptionsForSession(sessionId) {
    if (!sessionId) return 0;
    let revoked = 0;
    for (const [id, sub] of this.#subscriptions.entries()) {
      if (sub.sessionId === sessionId) {
        this.#subscriptions.delete(id);
        revoked++;
      }
    }
    return revoked;
  }

  getActiveSubscriberCount(channel = null) {
    if (!channel) return this.#subscriptions.size;
    let count = 0;
    for (const sub of this.#subscriptions.values()) {
      if (sub.channel === channel) count++;
    }
    return count;
  }

  getActiveSubscriptionCount(channel = null) {
    return this.getActiveSubscriberCount(channel);
  }

  clear() {
    this.#subscriptions.clear();
  }
}

export function createEventSubscriptionHub(options) {
  return new EventSubscriptionHub(options);
}
