#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/566bd2b5504d0aa94b2daac235cae299240dcbb6091045174285d2a3cc48723a/contract';
import endContract from '../../snapshots/566bd2b5504d0aa94b2daac235cae299240dcbb6091045174285d2a3cc48723a/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  foreignKey,
  lit,
  primaryKey,
  sql,
  unique,
} from '@prisma/orm-sqlite/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        table: 'AuthRateLimitBucket',
        columns: [
          col('keyHash', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('requestCount', 'INTEGER', {
            notNull: true,
            codecRef: { codecId: 'sqlite/integer@1' },
          }),
          col('windowStartedAt', 'TEXT', {
            notNull: true,
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
        ],
        constraints: [primaryKey(['keyHash'])],
      }),
      this.createTable({
        table: 'Conversation',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('updatedAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('userOneId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userTwoId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [primaryKey(['id']), unique(['userOneId', 'userTwoId'])],
      }),
      this.createTable({
        table: 'Follow',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('followerId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('followingId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['followerId', 'followingId']),
          foreignKey(['followerId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['followingId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'Message',
        columns: [
          col('body', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('conversationId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('readAt', 'TEXT', { codecRef: { codecId: 'sqlite/datetime@1' } }),
          col('senderId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          foreignKey(['conversationId'], 'Conversation', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'MessageReaction',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('messageId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('reaction', 'TEXT', {
            notNull: true,
            default: lit('heart'),
            codecRef: { codecId: 'sqlite/text@1' },
          }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['userId', 'messageId']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['messageId'], 'Message', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'Notification',
        columns: [
          col('actorId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('entityId', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('readAt', 'TEXT', { codecRef: { codecId: 'sqlite/datetime@1' } }),
          col('type', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['actorId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'PasswordResetToken',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('expiresAt', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/datetime@1' } }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('tokenHash', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('usedAt', 'TEXT', { codecRef: { codecId: 'sqlite/datetime@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [primaryKey(['id']), unique(['tokenHash'])],
      }),
      this.createTable({
        table: 'Post',
        columns: [
          col('authorId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('content', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('mediaUrl', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('musicTitle', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('type', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          foreignKey(['authorId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'PostBookmark',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('postId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['userId', 'postId']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['postId'], 'Post', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'PostComment',
        columns: [
          col('authorId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('body', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('parentId', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('postId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          foreignKey(['postId'], 'Post', ['id'], { onDelete: 'cascade' }),
          foreignKey(['authorId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['parentId'], 'PostComment', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'PostCommentLike',
        columns: [
          col('commentId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['userId', 'commentId']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['commentId'], 'PostComment', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'PostLike',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('postId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['userId', 'postId']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['postId'], 'Post', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'Story',
        columns: [
          col('caption', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('expiresAt', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/datetime@1' } }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('mediaUrl', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'StoryView',
        columns: [
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('storyId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('viewedAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['storyId', 'userId']),
          foreignKey(['storyId'], 'Story', ['id'], { onDelete: 'cascade' }),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createTable({
        table: 'User',
        columns: [
          col('avatarUrl', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('bio', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('email', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('fullName', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('language', 'TEXT', {
            notNull: true,
            default: lit('en'),
            codecRef: { codecId: 'sqlite/text@1' },
          }),
          col('passwordHash', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('sessionVersion', 'INTEGER', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'sqlite/integer@1' },
          }),
          col('theme', 'TEXT', {
            notNull: true,
            default: lit('light'),
            codecRef: { codecId: 'sqlite/text@1' },
          }),
          col('username', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('websiteUrl', 'TEXT', { codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [primaryKey(['id']), unique(['email']), unique(['username'])],
      }),
      this.createTable({
        table: 'VideoView',
        columns: [
          col('createdAt', 'TEXT', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'sqlite/datetime@1' },
          }),
          col('id', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('postId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
          col('userId', 'TEXT', { notNull: true, codecRef: { codecId: 'sqlite/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          unique(['userId', 'postId']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
          foreignKey(['postId'], 'Post', ['id'], { onDelete: 'cascade' }),
        ],
      }),
      this.createIndex({
        table: 'Conversation',
        index: 'Conversation_userOneId_updatedAt_idx_7ad371f3',
        columns: ['userOneId', 'updatedAt'],
      }),
      this.createIndex({
        table: 'Conversation',
        index: 'Conversation_userTwoId_updatedAt_idx_4a3ecd7a',
        columns: ['userTwoId', 'updatedAt'],
      }),
      this.createIndex({
        table: 'Follow',
        index: 'Follow_followerId_idx_2aa6c62d',
        columns: ['followerId'],
      }),
      this.createIndex({
        table: 'Follow',
        index: 'Follow_followingId_idx_1cf16645',
        columns: ['followingId'],
      }),
      this.createIndex({
        table: 'Message',
        index: 'Message_conversationId_createdAt_idx_44d4ac61',
        columns: ['conversationId', 'createdAt'],
      }),
      this.createIndex({
        table: 'Message',
        index: 'Message_conversationId_idx_669215a6',
        columns: ['conversationId'],
      }),
      this.createIndex({
        table: 'Message',
        index: 'Message_senderId_createdAt_idx_ed252b01',
        columns: ['senderId', 'createdAt'],
      }),
      this.createIndex({
        table: 'MessageReaction',
        index: 'MessageReaction_messageId_idx_3cdded8d',
        columns: ['messageId'],
      }),
      this.createIndex({
        table: 'MessageReaction',
        index: 'MessageReaction_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'Notification',
        index: 'Notification_actorId_idx_a58f6b4b',
        columns: ['actorId'],
      }),
      this.createIndex({
        table: 'Notification',
        index: 'Notification_userId_createdAt_idx_f726f04a',
        columns: ['userId', 'createdAt'],
      }),
      this.createIndex({
        table: 'Notification',
        index: 'Notification_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'PasswordResetToken',
        index: 'PasswordResetToken_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        table: 'PasswordResetToken',
        index: 'PasswordResetToken_userId_createdAt_idx_f726f04a',
        columns: ['userId', 'createdAt'],
      }),
      this.createIndex({
        table: 'Post',
        index: 'Post_authorId_createdAt_idx_854b4c86',
        columns: ['authorId', 'createdAt'],
      }),
      this.createIndex({
        table: 'Post',
        index: 'Post_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.createIndex({
        table: 'Post',
        index: 'Post_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        table: 'PostBookmark',
        index: 'PostBookmark_postId_idx_a7a72715',
        columns: ['postId'],
      }),
      this.createIndex({
        table: 'PostBookmark',
        index: 'PostBookmark_userId_createdAt_idx_f726f04a',
        columns: ['userId', 'createdAt'],
      }),
      this.createIndex({
        table: 'PostBookmark',
        index: 'PostBookmark_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'PostComment',
        index: 'PostComment_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.createIndex({
        table: 'PostComment',
        index: 'PostComment_parentId_createdAt_idx_d5e7872e',
        columns: ['parentId', 'createdAt'],
      }),
      this.createIndex({
        table: 'PostComment',
        index: 'PostComment_parentId_idx_6a68f597',
        columns: ['parentId'],
      }),
      this.createIndex({
        table: 'PostComment',
        index: 'PostComment_postId_createdAt_idx_b244c517',
        columns: ['postId', 'createdAt'],
      }),
      this.createIndex({
        table: 'PostComment',
        index: 'PostComment_postId_idx_a7a72715',
        columns: ['postId'],
      }),
      this.createIndex({
        table: 'PostCommentLike',
        index: 'PostCommentLike_commentId_idx_b5a4f615',
        columns: ['commentId'],
      }),
      this.createIndex({
        table: 'PostCommentLike',
        index: 'PostCommentLike_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'PostLike',
        index: 'PostLike_postId_idx_a7a72715',
        columns: ['postId'],
      }),
      this.createIndex({
        table: 'PostLike',
        index: 'PostLike_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'Story',
        index: 'Story_userId_expiresAt_idx_9721b56d',
        columns: ['userId', 'expiresAt'],
      }),
      this.createIndex({ table: 'Story', index: 'Story_userId_idx_a489d58a', columns: ['userId'] }),
      this.createIndex({
        table: 'StoryView',
        index: 'StoryView_storyId_idx_cd452158',
        columns: ['storyId'],
      }),
      this.createIndex({
        table: 'StoryView',
        index: 'StoryView_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        table: 'User',
        index: 'User_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        table: 'VideoView',
        index: 'VideoView_postId_idx_a7a72715',
        columns: ['postId'],
      }),
      this.createIndex({
        table: 'VideoView',
        index: 'VideoView_userId_idx_a489d58a',
        columns: ['userId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
