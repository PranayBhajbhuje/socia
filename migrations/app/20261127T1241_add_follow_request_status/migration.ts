#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2ca9d601fbede8ec1f0460dbb3b6885d0f019af8f5e939c2435c745763642b32/contract';
import endContract from '../../snapshots/2ca9d601fbede8ec1f0460dbb3b6885d0f019af8f5e939c2435c745763642b32/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/753c59d8d4405ba5b12155d969f3bf52992b1cb7cfd54aa96f87d1ede1b01fa8/contract';
import startContract from '../../snapshots/753c59d8d4405ba5b12155d969f3bf52992b1cb7cfd54aa96f87d1ede1b01fa8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-sqlite/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        table: 'Follow',
        column: {
          name: 'status',
          typeSql: 'TEXT',
          default: { kind: 'literal', value: 'accepted' },
          codecRef: { codecId: 'sqlite/text@1' },
          nullable: false,
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
