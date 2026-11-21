import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('roles_table', (table) => {
    table.integer('role_type').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('roles_table', (table) => {
    table.dropColumn('role_type');
  });
}
