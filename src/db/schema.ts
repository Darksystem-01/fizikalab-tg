import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. Users
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    nickname: text("nickname").notNull(),
    phoneHmac: text("phone_hmac").notNull(),
    phoneEncrypted: text("phone_encrypted").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("student"), // 'student' | 'creator' | 'moderator' | 'admin'
    status: text("status").notNull().default("pending"), // 'pending' | 'active' | 'banned' | 'deleted'
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    university: text("university"),
    faculty: text("faculty"),
    course: integer("course"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_nickname_unique_idx").on(sql`lower(${table.nickname})`),
    uniqueIndex("users_phone_hmac_unique_idx").on(table.phoneHmac),
    index("users_role_status_idx").on(table.role, table.status),
  ]
);

// 2. Sessions
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedFrom: text("rotated_from"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

// 3. OTP Codes
export const otpCodes = pgTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    phoneHmac: text("phone_hmac").notNull(),
    codeHmac: text("code_hmac").notNull(),
    purpose: text("purpose").notNull().default("register"), // 'register' | 'reset' | 'login2fa'
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("otp_phone_hmac_purpose_idx").on(table.phoneHmac, table.purpose),
    index("otp_expires_at_idx").on(table.expiresAt),
  ]
);

// 4. Topics (8 General Physics Chapters)
export const topics = pgTable(
  "topics",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("topics_sort_order_idx").on(table.sortOrder)]
);

// 5. Reels
export const reels = pgTable(
  "reels",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    title: text("title").notNull(),
    description: text("description"),
    problemText: text("problem_text"),
    answerText: text("answer_text"),
    hint: text("hint"),
    difficulty: text("difficulty").notNull().default("orta"), // 'oson' | 'orta' | 'qiyin'
    videoUrl: text("video_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    durationSec: integer("duration_sec").notNull().default(0),
    sizeBytes: integer("size_bytes").notNull().default(0),
    status: text("status").notNull().default("pending"), // 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
    rejectReason: text("reject_reason"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    viewsCount: integer("views_count").notNull().default(0),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("reels_feed_idx").on(table.status, table.publishedAt),
    index("reels_topic_status_idx").on(table.topicId, table.status),
    index("reels_author_idx").on(table.authorId),
  ]
);

// 6. Tags
export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 7. Reel Tags
export const reelTags = pgTable(
  "reel_tags",
  {
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.reelId, table.tagId] })]
);

// 8. Reel Likes
export const reelLikes = pgTable(
  "reel_likes",
  {
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.reelId, table.userId] }),
    index("reel_likes_user_id_idx").on(table.userId),
  ]
);

// 9. Reel Saves (Bookmarks)
export const reelSaves = pgTable(
  "reel_saves",
  {
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.reelId, table.userId] }),
    index("reel_saves_user_id_idx").on(table.userId),
  ]
);

// 10. Reel Views (Deduplicated with session/IP debounce)
export const reelViews = pgTable(
  "reel_views",
  {
    id: text("id").primaryKey(),
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionHash: text("session_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reel_views_reel_session_idx").on(table.reelId, table.sessionHash),
    index("reel_views_created_at_idx").on(table.createdAt),
  ]
);

// 11. Comments (1-level nested replies)
export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    body: text("body").notNull(),
    likesCount: integer("likes_count").notNull().default(0),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("comments_reel_created_idx").on(table.reelId, table.createdAt),
    index("comments_parent_id_idx").on(table.parentId),
  ]
);

// 12. Comment Likes
export const commentLikes = pgTable(
  "comment_likes",
  {
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.commentId, table.userId] })]
);

// 13. Follows
export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follows_following_idx").on(table.followingId),
  ]
);

// 14. Channels (Discord-style University Chat)
export const channels = pgTable(
  "channels",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull().default("public"), // 'public' | 'announcement'
    isArchived: boolean("is_archived").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("channels_sort_order_idx").on(table.sortOrder)]
);

// 15. Messages
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    replyToId: text("reply_to_id"),
    attachmentUrl: text("attachment_url"),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_channel_created_idx").on(table.channelId, table.createdAt),
    index("messages_user_idx").on(table.userId),
  ]
);

// 16. Message Reactions
export const messageReactions = pgTable(
  "message_reactions",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("msg_reaction_unique_idx").on(table.messageId, table.userId, table.emoji),
  ]
);

// 17. Mentions
export const mentions = pgTable(
  "mentions",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    mentionedUserId: text("mentioned_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("mentions_user_idx").on(table.mentionedUserId)]
);

// 18. Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'like' | 'comment' | 'mention' | 'moderation'
    data: text("data").notNull(), // JSON stringified payload
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.readAt)]
);

// 19. Reports (Content & User Flagging)
export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // 'reel' | 'comment' | 'message' | 'user'
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"), // 'pending' | 'resolved' | 'dismissed'
    handledBy: text("handled_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reports_status_idx").on(table.status)]
);

// 20. User Mutes
export const userMutes = pgTable(
  "user_mutes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
    until: timestamp("until", { withTimezone: true }).notNull(),
    reason: text("reason"),
    byModerator: text("by_moderator")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_mutes_user_until_idx").on(table.userId, table.until)]
);

// 21. User Bans
export const userBans = pgTable(
  "user_bans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    until: timestamp("until", { withTimezone: true }),
    reason: text("reason"),
    byModerator: text("by_moderator")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_bans_user_idx").on(table.userId)]
);

// 22. Audit Logs (Append-Only)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: text("metadata"), // JSON stringified details
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// 23. Rate Limits (DB fallback when Redis is absent)
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_expires_idx").on(table.expiresAt)]
);
