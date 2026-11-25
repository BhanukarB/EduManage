import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const existing = await knex('class_subjects_table').first('id');
  if (existing) {
    throw new Error('Existing class subject mappings require scheduling data before this migration can run');
  }
  await knex.schema.alterTable('class_subjects_table', (table) => {
    table.dropColumn('academic_session_id');
    table.dropColumn('updated_at');
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('section_id').nullable();
    table.uuid('batch_id').nullable();
    table.time('class_start_time').notNullable();
    table.time('class_end_time').notNullable();
    table.check('(section_id IS NULL) <> (batch_id IS NULL)', [], 'class_subject_one_group');
    table.check('class_start_time < class_end_time', [], 'class_subject_valid_slot');
  });
}

export async function down(knex: Knex): Promise<void> {
  const existing = await knex('class_subjects_table').first('id');
  if (existing) {
    throw new Error('Class subject schedules must be migrated before rolling back');
  }
  await knex.schema.alterTable('class_subjects_table', (table) => {
    table.dropChecks(['class_subject_one_group', 'class_subject_valid_slot']);
    table.dropColumns('org_id', 'branch_id', 'section_id', 'batch_id', 'class_start_time', 'class_end_time');
    table.uuid('academic_session_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}
