#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2ca9d601fbede8ec1f0460dbb3b6885d0f019af8f5e939c2435c745763642b32/contract';
import startContract from '../../snapshots/2ca9d601fbede8ec1f0460dbb3b6885d0f019af8f5e939c2435c745763642b32/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/5ebcaa466716226ceec7bb0c270b26bf0e87cb304951fd418cca5bd06ce77632/contract';
import endContract from '../../snapshots/5ebcaa466716226ceec7bb0c270b26bf0e87cb304951fd418cca5bd06ce77632/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  foreignKey,
  primaryKey,
  sql,
  unique,
} from '@prisma/orm-sqlite/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
        constraints: [
          primaryKey(['id']),
          unique(['tokenHash']),
          foreignKey(['userId'], 'User', ['id'], { onDelete: 'cascade' }),
        ],
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
        table: 'PasswordResetToken',
        index: 'PasswordResetToken_userId_idx_a489d58a',
        columns: ['userId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
