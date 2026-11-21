import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users_table', (table) => {
    table.string('password_hash').nullable();
    table.text('refresh_token_hash').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users_table', (table) => {
    table.dropColumn('refresh_token_hash');
    table.dropColumn('password_hash');
  });
}
