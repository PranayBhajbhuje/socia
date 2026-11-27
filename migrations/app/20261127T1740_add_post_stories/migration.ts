#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5ebcaa466716226ceec7bb0c270b26bf0e87cb304951fd418cca5bd06ce77632/contract';
import startContract from '../../snapshots/5ebcaa466716226ceec7bb0c270b26bf0e87cb304951fd418cca5bd06ce77632/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d78090a5699cd3896f7f197bfef1ece80ad68dec127e638c45917724c71dc3e7/contract';
import endContract from '../../snapshots/d78090a5699cd3896f7f197bfef1ece80ad68dec127e638c45917724c71dc3e7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-sqlite/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.recreateTable({
        tableName: 'Story',
        contractTable: {
          columns: [
            {
              name: 'caption',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/text@1' },
              nullable: true,
            },
            {
              name: 'createdAt',
              typeSql: 'TEXT',
              default: { kind: 'function', expression: sql`now()` },
              codecRef: { codecId: 'sqlite/datetime@1' },
              nullable: false,
            },
            {
              name: 'expiresAt',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/datetime@1' },
              nullable: false,
            },
            {
              name: 'id',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/text@1' },
              nullable: false,
            },
            {
              name: 'mediaUrl',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/text@1' },
              nullable: true,
            },
            {
              name: 'postId',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/text@1' },
              nullable: true,
            },
            {
              name: 'userId',
              typeSql: 'TEXT',
              codecRef: { codecId: 'sqlite/text@1' },
              nullable: false,
            },
          ],
          primaryKey: { columns: ['id'] },
          uniques: [],
          foreignKeys: [
            {
              columns: ['userId'],
              references: { table: 'User', columns: ['id'] },
              onDelete: 'cascade',
            },
            {
              columns: ['postId'],
              references: { table: 'Post', columns: ['id'] },
              onDelete: 'cascade',
            },
          ],
        },
        schemaColumnNames: ['caption', 'createdAt', 'expiresAt', 'id', 'mediaUrl', 'userId'],
        indexes: [
          { name: 'Story_postId_idx_a7a72715', columns: ['postId'] },
          {
            name: 'Story_userId_expiresAt_idx_9721b56d',
            columns: ['userId', 'expiresAt'],
          },
          { name: 'Story_userId_idx_a489d58a', columns: ['userId'] },
        ],
        summary:
          'Recreates table Story to apply schema changes: database/Story/column:mediaUrl; database/Story/foreign-key:postId->.Post(id); database/Story/column:postId',
        postchecks: [
          {
            description: 'verify "mediaUrl" nullability on "Story"',
            sql: `SELECT COUNT(*) > 0 FROM pragma_table_info('Story') WHERE name = 'mediaUrl' AND "notnull" = 0`,
          },
          {
            description: 'verify "postId" nullability on "Story"',
            sql: `SELECT COUNT(*) > 0 FROM pragma_table_info('Story') WHERE name = 'postId' AND "notnull" = 0`,
          },
          {
            description: 'verify foreign key (userId) → User(id) on "Story"',
            sql: `SELECT EXISTS (SELECT 1 FROM pragma_foreign_key_list('Story') f WHERE f."table" = 'User' AND f.on_delete = 'CASCADE' AND f.on_update = 'NO ACTION' GROUP BY f.id HAVING COUNT(*) = 1 AND SUM(CASE WHEN (f."from", f."to") IN (('userId', 'id')) THEN 1 ELSE 0 END) = 1)`,
          },
          {
            description: 'verify foreign key (postId) → Post(id) on "Story"',
            sql: `SELECT EXISTS (SELECT 1 FROM pragma_foreign_key_list('Story') f WHERE f."table" = 'Post' AND f.on_delete = 'CASCADE' AND f.on_update = 'NO ACTION' GROUP BY f.id HAVING COUNT(*) = 1 AND SUM(CASE WHEN (f."from", f."to") IN (('postId', 'id')) THEN 1 ELSE 0 END) = 1)`,
          },
          {
            description: 'verify "Story" has exactly 2 foreign keys',
            sql: "SELECT (SELECT COUNT(DISTINCT id) FROM pragma_foreign_key_list('Story')) = 2",
          },
        ],
        operationClass: 'widening',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
