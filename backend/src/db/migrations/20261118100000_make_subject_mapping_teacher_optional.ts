import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('section_subjects_table', (table) => {
    table.uuid('teacher_user_id').nullable().alter();
  });
  await knex.schema.alterTable('batch_subjects_table', (table) => {
    table.uuid('teacher_user_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('batch_subjects_table', (table) => {
    table.uuid('teacher_user_id').notNullable().alter();
  });
  await knex.schema.alterTable('section_subjects_table', (table) => {
    table.uuid('teacher_user_id').notNullable().alter();
  });
}
