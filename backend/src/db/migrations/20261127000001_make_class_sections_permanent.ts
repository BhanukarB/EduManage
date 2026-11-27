import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('sections_table', 'academic_session_id')) {
    // Preserve the session on legacy subject assignments before removing it from sections.
    await knex.raw(`
      UPDATE section_subjects_table ss
      SET academic_session_id = s.academic_session_id
      FROM sections_table s
      WHERE ss.section_id = s.id AND ss.academic_session_id IS NULL
    `);
    await knex.schema.alterTable('sections_table', (table) => {
      table.dropColumn('academic_session_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // A permanent section may have subjects in several sessions.
  await knex.schema.alterTable('sections_table', (table) => {
    table.uuid('academic_session_id').nullable();
  });
}
