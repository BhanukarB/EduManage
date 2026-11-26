import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasStatus = await knex.schema.hasColumn('academic_sessions_table', 'status');
  if (!hasStatus) {
    await knex.schema.alterTable('academic_sessions_table', (table) => {
      table.integer('status').notNullable().defaultTo(1);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasStatus = await knex.schema.hasColumn('academic_sessions_table', 'status');
  if (hasStatus) {
    await knex.schema.alterTable('academic_sessions_table', (table) => {
      table.dropColumn('status');
    });
  }
}
