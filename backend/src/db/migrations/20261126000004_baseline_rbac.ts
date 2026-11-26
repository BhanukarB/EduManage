import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('roles_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('role_name').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.integer('role_type').nullable();
  });

  await knex.schema.createTable('permissions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('permission').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_roles_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users_table');
    table.uuid('role_id').notNullable().references('id').inTable('roles_table');
    table.uuid('org_id').nullable().references('id').inTable('organisations');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('branch_id').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.foreign(['org_id', 'branch_id']).references(['org_id', 'id']).inTable('branches');
    table.check('branch_id IS NULL OR org_id IS NOT NULL', [], 'user_role_branch_requires_org');
    table.unique(['user_id', 'role_id'], {
      indexName: 'global_grant_unique',
      predicate: knex.queryBuilder().whereNull('org_id'),
    });
    table.unique(['user_id', 'role_id', 'org_id'], {
      indexName: 'org_grant_unique',
      predicate: knex.queryBuilder().whereNotNull('org_id').whereNull('branch_id'),
    });
    table.unique(['user_id', 'role_id', 'org_id', 'branch_id'], {
      indexName: 'branch_grant_unique',
      predicate: knex.queryBuilder().whereNotNull('branch_id'),
    });
  });

  await knex.schema.createTable('role_permissions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('role_id').notNullable().references('id').inTable('roles_table').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions_table').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['role_id', 'permission_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('role_permissions_table');
  await knex.schema.dropTable('user_roles_table');
  await knex.schema.dropTable('permissions_table');
  await knex.schema.dropTable('roles_table');
}
