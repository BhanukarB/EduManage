import { ConflictException } from '@nestjs/common';
import type { Knex } from 'knex';

const membership = 'staff_branch_memberships';
const staff = 'organisation_staff_table';
const grants = 'user_roles_table';
const person = ['org_id', 'user_id'];
const scope = [...person, 'branch_id'];

interface ProfileCount {
  org_id: string;
  user_id: string;
  profiles: string;
}

export async function up(db: Knex): Promise<void> {
  const duplicate = await db(staff)
    .select(person).groupBy(person).count<ProfileCount[]>({ profiles: '*' })
    .then(rows => rows.find(row => Number(row.profiles) > 1));
  if (duplicate) {
    throw new ConflictException(
      `Reconcile staff profiles for user ${duplicate.user_id} in organisation ${duplicate.org_id} before migration`,
    );
  }
  await db.schema.alterTable(staff, table => table.unique(person));
  await db.schema.alterTable('branches', table => table.unique(['org_id', 'id']));
  await db.schema.createTable(membership, table => {
    table.uuid('id').primary();
    table.uuid('org_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.integer('status').notNullable().defaultTo(1).checkIn(['0', '1', '2']);
    table.unique(scope);
    table.foreign(person).references(person).inTable(staff);
    table.foreign(['org_id', 'branch_id']).references(['org_id', 'id']).inTable('branches');
  });
  await db.schema.alterTable(grants, table => {
    table.uuid('branch_id').nullable();
    table.check('branch_id IS NULL OR org_id IS NOT NULL', [], 'user_role_branch_requires_org');
    table.foreign(scope).references(scope).inTable(membership);
  });
}

export async function down(db: Knex): Promise<void> {
  if (await db(membership).first('id') || await db(grants).whereNotNull('branch_id').first('id')) {
    throw new ConflictException('Preserve branch memberships and scoped grants before rollback');
  }
  await db.schema.alterTable(grants, table => table.dropColumn('branch_id'));
  await db.schema.dropTable(membership);
  await db.schema.alterTable('branches', table => table.dropUnique(['org_id', 'id']));
  await db.schema.alterTable(staff, table => table.dropUnique(person));
}
