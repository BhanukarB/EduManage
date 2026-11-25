import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('branch_subjects_table', (table) => {
    table.uuid('id').primary();
    table.uuid('branch_id').notNullable().references('id').inTable('branches');
    table.uuid('subject_id').notNullable().references('id').inTable('subjects_table');
    table.unique(['branch_id', 'subject_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('branch_subjects_table');
}
