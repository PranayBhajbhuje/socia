#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/566bd2b5504d0aa94b2daac235cae299240dcbb6091045174285d2a3cc48723a/contract';
import startContract from '../../snapshots/566bd2b5504d0aa94b2daac235cae299240dcbb6091045174285d2a3cc48723a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/753c59d8d4405ba5b12155d969f3bf52992b1cb7cfd54aa96f87d1ede1b01fa8/contract';
import endContract from '../../snapshots/753c59d8d4405ba5b12155d969f3bf52992b1cb7cfd54aa96f87d1ede1b01fa8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-sqlite/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropTable({ table: 'PasswordResetToken' })];
  }
}

MigrationCLI.run(import.meta.url, M);
