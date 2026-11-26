import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('first_name').notNullable();
    table.string('middle_name').nullable();
    table.string('last_name').notNullable();
    table.text('email_id');
    table.string('phone_number').nullable();
    table.uuid('org_id');
    table.index('org_id');
    table.jsonb('address').nullable();
    table.timestamps(true, true); // created_at, updated_at (with defaults)
    table.string('password_hash').nullable();
    table.text('refresh_token_hash').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users_table');
}
