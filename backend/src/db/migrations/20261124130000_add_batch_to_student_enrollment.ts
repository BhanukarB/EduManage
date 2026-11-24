import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('student_enrollment', (table) => {
    table.uuid('batch_id').nullable().references('id').inTable('batches_table');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('student_enrollment', (table) => {
    table.dropColumn('batch_id');
  });
}
