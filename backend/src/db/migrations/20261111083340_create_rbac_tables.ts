import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {

  await knex.schema.createTable('roles_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('role_name').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_roles_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users_table');
    table.uuid('role_id').notNullable().references('id').inTable('roles_table');
    table.uuid('org_id').nullable().references('id').inTable('organisations');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'role_id', 'org_id']);
  });

  await knex.schema.createTable('permissions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('permission').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('role_permissions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('role_id').notNullable().references('id').inTable('roles_table').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions_table').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['role_id', 'permission_id']);
  });

}

// ---------------------------------------------------------------------------
// down – drop tables in reverse dependency order
// ---------------------------------------------------------------------------
export async function down(knex: Knex): Promise<void> {

  await knex.schema.dropTableIfExists('role_permissions_table');
  await knex.schema.dropTableIfExists('permissions_table');
  await knex.schema.dropTableIfExists('user_roles_table');
  await knex.schema.dropTableIfExists('roles_table');
}
