import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer,
  json,
  pgEnum,
  index,
  foreignKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userStatusEnum = pgEnum('user_status', ['online', 'away', 'busy', 'offline']);
export const channelTypeEnum = pgEnum('channel_type', ['text', 'voice', 'private']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file', 'system']);
export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', ['owner', 'admin', 'member']);

// ============================================================================
// CORE TABLES
// ============================================================================

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  password: varchar('password', { length: 256 }).notNull(),
  avatar: text('avatar'),
  status: userStatusEnum('status').default('offline').notNull(),
  statusMessage: text('status_message'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: varchar('email_verification_token', { length: 256 }),
  resetPasswordToken: varchar('reset_password_token', { length: 256 }),
  resetPasswordExpires: timestamp('reset_password_expires'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
  lastActiveIdx: index('users_last_active_idx').on(table.lastActiveAt),
}));

// 2. Workspaces Table  
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inviteCode: varchar('invite_code', { length: 32 }).unique(),
  isPublic: boolean('is_public').default(false).notNull(),
  settings: json('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('workspaces_slug_idx').on(table.slug),
  ownerIdx: index('workspaces_owner_idx').on(table.ownerId),
  inviteCodeIdx: index('workspaces_invite_code_idx').on(table.inviteCode),
}));

// 3. Workspace Members Table (Many-to-Many between Users and Workspaces)
export const workspaceMembers = pgTable('workspace_members', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: workspaceMemberRoleEnum('role').default('member').notNull(),
  customTitle: varchar('custom_title', { length: 100 }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  workspaceUserIdx: index('workspace_members_workspace_user_idx').on(table.workspaceId, table.userId),
  userIdx: index('workspace_members_user_idx').on(table.userId),
}));

// 4. Channels Table
export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(),
  description: text('description'),
  type: channelTypeEnum('type').default('text').notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  topic: text('topic'),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  lastMessageAt: timestamp('last_message_at'),
  memberCount: integer('member_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('channels_workspace_idx').on(table.workspaceId),
  nameIdx: index('channels_name_idx').on(table.workspaceId, table.name),
  lastMessageIdx: index('channels_last_message_idx').on(table.lastMessageAt),
}));

// 5. Channel Members Table (Many-to-Many between Users and Channels)
export const channelMembers = pgTable('channel_members', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  canPost: boolean('can_post').default(true).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at').defaultNow(),
}, (table) => ({
  channelUserIdx: index('channel_members_channel_user_idx').on(table.channelId, table.userId),
  userIdx: index('channel_members_user_idx').on(table.userId),
}));

// 6. Messages Table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: messageTypeEnum('type').default('text').notNull(),
  attachments: json('attachments').default([]),
  threadId: integer('thread_id').references(() => messages.id),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  channelIdx: index('messages_channel_idx').on(table.channelId),
  userIdx: index('messages_user_idx').on(table.userId),
  threadIdx: index('messages_thread_idx').on(table.threadId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  contentSearchIdx: index('messages_content_search_idx').on(table.content), // For full-text search
}));

// 7. Emojis Table (moved before message reactions)
export const emojis = pgTable('emojis', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }), // null for default emojis
  name: varchar('name', { length: 50 }).notNull(),
  shortcode: varchar('shortcode', { length: 50 }).notNull(),
  imageUrl: text('image_url'),
  isCustom: boolean('is_custom').default(false).notNull(),
  createdById: integer('created_by_id').references(() => users.id),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  shortcodeIdx: index('emojis_shortcode_idx').on(table.shortcode),
  workspaceShortcodeIdx: index('emojis_workspace_shortcode_idx').on(table.workspaceId, table.shortcode),
  usageIdx: index('emojis_usage_idx').on(table.usageCount),
}));

// 8. Message Reactions Table
export const messageReactions = pgTable('message_reactions', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emojiId: integer('emoji_id').notNull().references(() => emojis.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  messageUserEmojiIdx: index('message_reactions_msg_user_emoji_idx').on(table.messageId, table.userId, table.emojiId),
  messageIdx: index('message_reactions_message_idx').on(table.messageId),
}));

// 9. Huddles Table
export const huddles = pgTable('huddles', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 100 }).notNull(),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  maxParticipants: integer('max_participants').default(8),
  isActive: boolean('is_active').default(true).notNull(),
  settings: json('settings').default({}), // Audio settings, recording preferences, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
}, (table) => ({
  channelIdx: index('huddles_channel_idx').on(table.channelId),
  activeIdx: index('huddles_active_idx').on(table.isActive),
  createdAtIdx: index('huddles_created_at_idx').on(table.createdAt),
}));

// 10. Huddle Participants Table
export const huddleParticipants = pgTable('huddle_participants', {
  id: serial('id').primaryKey(),
  huddleId: integer('huddle_id').notNull().references(() => huddles.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  isMuted: boolean('is_muted').default(false),
  isDeafened: boolean('is_deafened').default(false),
}, (table) => ({
  huddleUserIdx: index('huddle_participants_huddle_user_idx').on(table.huddleId, table.userId),
  activeIdx: index('huddle_participants_active_idx').on(table.huddleId, table.leftAt), // For active participants
}));

// ============================================================================
// RELATIONS (for Drizzle's relational queries)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  channelMembers: many(channelMembers),
  messages: many(messages),
  messageReactions: many(messageReactions),
  createdWorkspaces: many(workspaces),
  createdChannels: many(channels),
  createdEmojis: many(emojis),
  huddleParticipants: many(huddleParticipants),
  createdHuddles: many(huddles),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  channels: many(channels),
  emojis: many(emojis),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [channels.createdById],
    references: [users.id],
  }),
  members: many(channelMembers),
  messages: many(messages),
  huddles: many(huddles),
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [channelMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  thread: one(messages, {
    fields: [messages.threadId],
    references: [messages.id],
  }),
  replies: many(messages),
  reactions: many(messageReactions),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
  emoji: one(emojis, {
    fields: [messageReactions.emojiId],
    references: [emojis.id],
  }),
}));

export const emojisRelations = relations(emojis, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [emojis.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [emojis.createdById],
    references: [users.id],
  }),
  reactions: many(messageReactions),
}));

export const huddlesRelations = relations(huddles, ({ one, many }) => ({
  channel: one(channels, {
    fields: [huddles.channelId],
    references: [channels.id],
  }),
  createdBy: one(users, {
    fields: [huddles.createdById],
    references: [users.id],
  }),
  participants: many(huddleParticipants),
}));

export const huddleParticipantsRelations = relations(huddleParticipants, ({ one }) => ({
  huddle: one(huddles, {
    fields: [huddleParticipants.huddleId],
    references: [huddles.id],
  }),
  user: one(users, {
    fields: [huddleParticipants.userId],
    references: [users.id],
  }),
}));
