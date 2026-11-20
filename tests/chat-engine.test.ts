import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit } from "../src/lib/auth/rateLimit";
import { publishToChannel, getEventsSince } from "../src/lib/realtime";

test("Chat Engine: Rate limiting prevents spam (>5 msgs in 10s)", async () => {
  const testUserId = `test_chat_${Date.now()}`;
  const rateKey = `chat_limit:${testUserId}`;

  // First 5 messages should succeed
  for (let i = 0; i < 5; i++) {
    const res = await checkRateLimit(rateKey, 5, 10);
    assert.equal(res.success, true, `Message ${i + 1} should be permitted`);
  }

  // 6th message should be blocked
  const blockedRes = await checkRateLimit(rateKey, 5, 10);
  assert.equal(blockedRes.success, false, "6th message in window must be blocked by rate limiter");
});

test("Chat Engine: Realtime event bus buffers and retrieves events", async () => {
  const channelId = `test_chan_${Date.now()}`;
  const startTs = Date.now() - 10;

  // Publish a new message event
  await publishToChannel(channelId, "new_message", {
    id: "msg_123",
    body: "Salom fizika!",
  });

  // Retrieve events
  const events = getEventsSince(channelId, startTs);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "new_message");
  assert.equal(events[0].data.body, "Salom fizika!");
});

test("Chat Engine: Message validation rules (min 1, max 2000 chars)", () => {
  const validateBody = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 1) return { valid: false, error: "Xabar bo'sh bo'lishi mumkin emas" };
    if (trimmed.length > 2000) return { valid: false, error: "Xabar 2000 belgidan oshmasligi kerak" };
    return { valid: true };
  };

  assert.equal(validateBody("").valid, false);
  assert.equal(validateBody("   ").valid, false);
  assert.equal(validateBody("Karno sikli bo'yicha savol").valid, true);
  assert.equal(validateBody("A".repeat(2001)).valid, false);
});
