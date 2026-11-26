import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasSectionSession = await knex.schema.hasColumn('section_subjects_table', 'academic_session_id');
  if (!hasSectionSession) {
    await knex.schema.alterTable('section_subjects_table', (table) => {
      table.uuid('academic_session_id').nullable();
    });
  }
  const hasSectionsSession = await knex.schema.hasColumn('sections_table', 'academic_session_id');
  if (hasSectionsSession) {
    await knex.raw(`
      UPDATE section_subjects_table ss
      SET academic_session_id = s.academic_session_id
      FROM sections_table s
      WHERE ss.section_id = s.id AND ss.academic_session_id IS NULL
    `);
  }
  const nullSectionSubjects = await knex('section_subjects_table').whereNull('academic_session_id').first('id');
  if (!nullSectionSubjects) {
    await knex.schema.alterTable('section_subjects_table', (table) => {
      table.uuid('academic_session_id').notNullable().alter();
    });
  }

  const hasBatchSession = await knex.schema.hasColumn('batch_subjects_table', 'academic_session_id');
  if (!hasBatchSession) {
    await knex.schema.alterTable('batch_subjects_table', (table) => {
      table.uuid('academic_session_id').nullable();
    });
  }
  const hasBatchesSession = await knex.schema.hasColumn('batches_table', 'academic_session_id');
  if (hasBatchesSession) {
    await knex.raw(`
      UPDATE batch_subjects_table bs
      SET academic_session_id = b.academic_session_id
      FROM batches_table b
      WHERE bs.batch_id = b.id AND bs.academic_session_id IS NULL
    `);
  }
  const nullBatchSubjects = await knex('batch_subjects_table').whereNull('academic_session_id').first('id');
  if (!nullBatchSubjects) {
    await knex.schema.alterTable('batch_subjects_table', (table) => {
      table.uuid('academic_session_id').notNullable().alter();
    });
  }

  const hasClassSubjectIsActive = await knex.schema.hasColumn('class_subjects_table', 'is_active');
  if (!hasClassSubjectIsActive) {
    await knex.schema.alterTable('class_subjects_table', (table) => {
      table.boolean('is_active').notNullable().defaultTo(true);
    });
  }

  const hasBatchStartDate = await knex.schema.hasColumn('batches_table', 'start_date');
  const hasBatchEndDate = await knex.schema.hasColumn('batches_table', 'end_date');
  if (!hasBatchStartDate || !hasBatchEndDate) {
    await knex.schema.alterTable('batches_table', (table) => {
      if (!hasBatchStartDate) table.date('start_date').nullable();
      if (!hasBatchEndDate) table.date('end_date').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasClassSubjectIsActive = await knex.schema.hasColumn('class_subjects_table', 'is_active');
  if (hasClassSubjectIsActive) {
    await knex.schema.alterTable('class_subjects_table', (table) => {
      table.dropColumn('is_active');
    });
  }

  const hasBatchSession = await knex.schema.hasColumn('batch_subjects_table', 'academic_session_id');
  if (hasBatchSession) {
    await knex.schema.alterTable('batch_subjects_table', (table) => {
      table.dropColumn('academic_session_id');
    });
  }

  const hasSectionSession = await knex.schema.hasColumn('section_subjects_table', 'academic_session_id');
  if (hasSectionSession) {
    await knex.schema.alterTable('section_subjects_table', (table) => {
      table.dropColumn('academic_session_id');
    });
  }
}
