import * as Ably from "ably";

export interface RealtimeMessageEvent {
  id: string;
  channelId: string;
  event: "new_message" | "edit_message" | "delete_message" | "reaction_toggle";
  data: any;
  timestamp: number;
}

// In-memory ring buffer for fallback when Ably keys are missing or offline polling
interface ChannelBuffer {
  events: RealtimeMessageEvent[];
  lastCleaned: number;
}

const memoryBuffers = new Map<string, ChannelBuffer>();
const BUFFER_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EVENTS_PER_CHANNEL = 100;

function getAblyRest(): Ably.Rest | null {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "mock") {
    return null;
  }
  try {
    return new Ably.Rest({ key: apiKey });
  } catch (err) {
    console.warn("[Realtime] Failed to initialize Ably REST client:", err);
    return null;
  }
}

/**
 * Publishes an event to a specific chat channel via Ably with an in-memory fallback.
 */
export async function publishToChannel(
  channelId: string,
  event: RealtimeMessageEvent["event"],
  data: any
): Promise<void> {
  const now = Date.now();
  const eventPayload: RealtimeMessageEvent = {
    id: `ev_${now}_${Math.random().toString(36).slice(2, 8)}`,
    channelId,
    event,
    data,
    timestamp: now,
  };

  // 1. Store in memory buffer (for polling / fallback)
  let buf = memoryBuffers.get(channelId);
  if (!buf) {
    buf = { events: [], lastCleaned: now };
    memoryBuffers.set(channelId, buf);
  }

  // Periodic cleanup
  if (now - buf.lastCleaned > 60_000) {
    buf.events = buf.events.filter((e) => now - e.timestamp < BUFFER_TTL_MS);
    buf.lastCleaned = now;
  }

  buf.events.push(eventPayload);
  if (buf.events.length > MAX_EVENTS_PER_CHANNEL) {
    buf.events.shift();
  }

  // 2. Publish to Ably if configured
  const ably = getAblyRest();
  if (ably) {
    try {
      const channel = ably.channels.get(`fizikalab:channel:${channelId}`);
      await channel.publish(event, eventPayload);
    } catch (err) {
      console.warn(`[Realtime] Error broadcasting to Ably channel ${channelId}:`, err);
    }
  }
}

/**
 * Retrieves missed events for polling clients since a given timestamp.
 */
export function getEventsSince(channelId: string, sinceTimestamp: number): RealtimeMessageEvent[] {
  const buf = memoryBuffers.get(channelId);
  if (!buf) return [];
  return buf.events.filter((e) => e.timestamp > sinceTimestamp);
}

/**
 * Creates an Ably token request for client-side authentication.
 */
export async function createAblyTokenRequest(clientId: string): Promise<Ably.TokenRequest | null> {
  const ably = getAblyRest();
  if (!ably) return null;
  try {
    const tokenParams: Ably.TokenParams = {
      clientId,
      capability: JSON.stringify({
        "fizikalab:channel:*": ["subscribe", "presence"],
      }),
    };
    return await ably.auth.createTokenRequest(tokenParams);
  } catch (err) {
    console.error("[Realtime] Error creating Ably token request:", err);
    return null;
  }
}
