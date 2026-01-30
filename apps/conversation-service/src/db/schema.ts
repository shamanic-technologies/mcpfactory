import { pgTable, uuid, text, timestamp, uniqueIndex, decimal, jsonb } from "drizzle-orm/pg-core";

// Local orgs table (maps to Clerk)
export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_orgs_clerk_id").on(table.clerkOrgId),
  ]
);

// Replies received from leads
export const replies = pgTable(
  "replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    emailId: text("email_id").notNull(), // Reference to postmark-service emails table
    campaignRunId: text("campaign_run_id").notNull(),
    
    // Email details
    fromEmail: text("from_email").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    
    // Postmark tracking
    postmarkMessageId: text("postmark_message_id"),
    
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    
    // Raw webhook data
    webhookRaw: jsonb("webhook_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_replies_org").on(table.orgId),
    uniqueIndex("idx_replies_email").on(table.emailId),
    uniqueIndex("idx_replies_run").on(table.campaignRunId),
  ]
);

// AI qualifications of replies
export const replyQualifications = pgTable(
  "reply_qualifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    replyId: uuid("reply_id")
      .notNull()
      .references(() => replies.id, { onDelete: "cascade" }),
    
    // Classification result
    classification: text("classification").notNull(), // 'willing_to_meet', 'interested', 'not_interested', 'out_of_office', 'unsubscribe', 'other'
    confidence: decimal("confidence", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
    reasoning: text("reasoning"),
    
    // Model info
    model: text("model").notNull().default("claude-3-haiku-20240307"),
    costUsd: decimal("cost_usd", { precision: 10, scale: 6 }),
    
    // Raw response
    responseRaw: jsonb("response_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_qualifications_reply").on(table.replyId),
  ]
);

// Forwards to clients
export const forwards = pgTable(
  "forwards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    replyId: uuid("reply_id")
      .notNull()
      .references(() => replies.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    
    forwardedTo: text("forwarded_to").notNull(), // Client email
    forwardedAt: timestamp("forwarded_at", { withTimezone: true }).notNull(),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_forwards_reply").on(table.replyId),
    uniqueIndex("idx_forwards_org").on(table.orgId),
  ]
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
export type ReplyQualification = typeof replyQualifications.$inferSelect;
export type NewReplyQualification = typeof replyQualifications.$inferInsert;
export type Forward = typeof forwards.$inferSelect;
export type NewForward = typeof forwards.$inferInsert;
