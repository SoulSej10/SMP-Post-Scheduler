import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const platformEnum = pgEnum("platform", ["facebook", "instagram", "linkedin"])
export const postStatusEnum = pgEnum("post_status", ["scheduled", "posted", "failed"])
export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member", "viewer"])
export const memberStatusEnum = pgEnum("member_status", ["pending", "active", "inactive"])
export const notificationTypeEnum = pgEnum("notification_type", [
  "success",
  "warning",
  "error",
  "info",
  "share",
  "member",
  "schedule",
])
export const sharePrivilegeEnum = pgEnum("share_privilege", ["view", "feedback", "approve", "edit"])

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  profilePicture: text("profile_picture"),
  role: text("role"),
  phone: text("phone"),
  bio: text("bio"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  currentCompanyId: text("current_company_id"),
  preferences: jsonb("preferences").$type<{
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReports: boolean
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const companyMembers = pgTable("company_members", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: memberRoleEnum("role").notNull().default("member"),
  status: memberStatusEnum("status").notNull().default("pending"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
})

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: postStatusEnum("status").notNull().default("scheduled"),
  link: text("link"),
  feedback: text("feedback"),
  boosted: boolean("boosted").notNull().default(false),
  approvalStatus: text("approval_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const platformSettings = pgTable(
  "platform_settings",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    scheduleDays: jsonb("schedule_days").$type<string[]>().notNull().default([]),
    connected: boolean("connected").notNull().default(false),
    username: text("username"),
    lastSync: timestamp("last_sync", { withTimezone: true }),
    // OAuth connection - externalAccountId/accessToken are never sent to the client
    externalAccountId: text("external_account_id"),
    accessToken: text("access_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    connectedByUserId: text("connected_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    companyPlatformUnique: uniqueIndex("platform_settings_company_platform_idx").on(t.companyId, t.platform),
  }),
)

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").notNull().default(false),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const shareLinks = pgTable("share_links", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  platform: platformEnum("platform"),
  privileges: jsonb("privileges").$type<string[]>().notNull().default([]),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  accessCount: integer("access_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  posts: many(posts),
  notifications: many(notifications),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
  members: many(companyMembers),
  posts: many(posts),
  platformSettings: many(platformSettings),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  company: one(companies, { fields: [posts.companyId], references: [companies.id] }),
}))

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, { fields: [companyMembers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyMembers.userId], references: [users.id] }),
}))
