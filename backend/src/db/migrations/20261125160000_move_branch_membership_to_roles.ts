import { ConflictException } from '@nestjs/common';
import type { Knex } from 'knex';

const grants = 'user_roles_table';
const memberships = 'staff_branch_memberships';
const scope = ['org_id', 'user_id', 'branch_id'];
const branch = ['org_id', 'branch_id'];

export async function up(db: Knex): Promise<void> {
  // Acquire the grants table lock before reading the membership snapshot.
  await db.schema.alterTable(grants, table => {
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.foreign(branch).references(['org_id', 'id']).inTable('branches');
  });

  const matchingGrant = db(grants).select('id');
  for (const column of scope) matchingGrant.where(column, db.ref('m.' + column));
  const roleless = await db(memberships + ' as m').whereNotExists(matchingGrant).first('m.id');
  if (roleless) throw new ConflictException('A staff branch membership has no role. Resolve its assignment before migrating.');

  for (const status of [0, 2]) {
    await db(grants).whereIn(scope, db(memberships).where({ status }).select(scope))
      .update({ is_active: false, is_deleted: status === 2 });
  }
  await db.schema.alterTable(grants, table => table.dropForeign(scope));
  await db.schema.dropTable(memberships);
}

export async function down(db: Knex): Promise<void> {
  const scoped = db(grants).whereNotNull('branch_id');
  const states = await scoped.distinct(...scope, 'is_active', 'is_deleted');
  const seen = new Set<string>();
  for (const row of states) {
    const key = scope.map(column => row[column]).join('/');
    if (seen.has(key)) throw new ConflictException('Different role states cannot be restored as one membership.');
    seen.add(key);
  }

  await db.schema.createTable(memberships, table => {
    table.uuid('id').primary().defaultTo(db.fn.uuid());
    for (const column of scope) table.uuid(column).notNullable();
    table.integer('status').notNullable().defaultTo(1).checkIn(['0', '1', '2']);
    table.unique(scope);
    table.foreign(['org_id', 'user_id']).references(['org_id', 'user_id']).inTable('organisation_staff_table');
    table.foreign(branch).references(['org_id', 'id']).inTable('branches');
  });
  for (const row of states) {
    await db(memberships).insert({ org_id: row.org_id, user_id: row.user_id, branch_id: row.branch_id,
      status: row.is_deleted ? 2 : Number(row.is_active) });
  }
  await db.schema.alterTable(grants, table => {
    table.foreign(scope).references(scope).inTable(memberships);
    table.dropForeign(branch);
    table.dropColumn('is_active');
    table.dropColumn('is_deleted');
  });
}
