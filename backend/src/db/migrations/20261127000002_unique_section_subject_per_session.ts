import type { Knex } from 'knex';

const columns = ['section_id', 'subject_id', 'academic_session_id'];
const constraint = 'section_subject_session_unique';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('section_subjects_table', (table) => {
    table.unique(columns, { indexName: constraint });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('section_subjects_table', (table) => {
    table.dropUnique(columns, constraint);
  });
}
