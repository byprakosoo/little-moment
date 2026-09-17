import { boolean, datetime, index, int, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 191 }).primaryKey(),
  expiresAt: datetime("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 191 }).notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({ userIdIdx: index("session_user_id_idx").on(table.userId) }));

export const account = mysqlTable("account", {
  id: varchar("id", { length: 191 }).primaryKey(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 191 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
}, (table) => ({ providerAccountIdx: uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId) }));

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 191 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at"),
  updatedAt: datetime("updated_at"),
}, (table) => ({ identifierIdx: index("verification_identifier_idx").on(table.identifier) }));

export const families = mysqlTable("families", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const familyMembers = mysqlTable("family_members", {
  id: varchar("id", { length: 191 }).primaryKey(),
  familyId: varchar("family_id", { length: 191 }).notNull().references(() => families.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 191 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  role: varchar("role", { length: 24 }).notNull().default("member"),
  inviteStatus: varchar("invite_status", { length: 24 }).notNull().default("accepted"),
  createdAt: datetime("created_at").notNull(),
}, (table) => ({ familyUserIdx: uniqueIndex("family_members_family_user_idx").on(table.familyId, table.userId), familyIdx: index("family_members_family_idx").on(table.familyId) }));

export const children = mysqlTable("children", {
  id: varchar("id", { length: 191 }).primaryKey(),
  familyId: varchar("family_id", { length: 191 }).notNull().references(() => families.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 40 }).notNull(),
  birthDate: varchar("birth_date", { length: 10 }).notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
}, (table) => ({ familyIdx: uniqueIndex("children_family_idx").on(table.familyId) }));

export const entries = mysqlTable("entries", {
  id: varchar("id", { length: 191 }).primaryKey(),
  familyId: varchar("family_id", { length: 191 }).notNull().references(() => families.id, { onDelete: "cascade" }),
  childId: varchar("child_id", { length: 191 }).notNull().references(() => children.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 191 }).notNull().references(() => user.id),
  type: varchar("type", { length: 24 }).notNull().default("story"),
  title: varchar("title", { length: 80 }).notNull().default(""),
  body: text("body").notNull(),
  happenedAt: varchar("happened_at", { length: 10 }).notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
}, (table) => ({ familyDateIdx: index("entries_family_date_idx").on(table.familyId, table.happenedAt), childIdx: index("entries_child_idx").on(table.childId) }));

export const photos = mysqlTable("photos", {
  id: varchar("id", { length: 191 }).primaryKey(),
  entryId: varchar("entry_id", { length: 191 }).notNull().references(() => entries.id, { onDelete: "cascade" }),
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteSize: int("byte_size").notNull().default(0),
  checksum: varchar("checksum", { length: 128 }),
  altText: varchar("alt_text", { length: 255 }),
  status: varchar("status", { length: 24 }).notNull().default("uploaded"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: datetime("created_at").notNull(),
}, (table) => ({ entryIdx: index("photos_entry_idx").on(table.entryId) }));

export const invites = mysqlTable("invites", {
  id: varchar("id", { length: 191 }).primaryKey(),
  familyId: varchar("family_id", { length: 191 }).notNull().references(() => families.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").notNull(),
});

export const schema = { user, session, account, verification, families, familyMembers, children, entries, photos, invites };
