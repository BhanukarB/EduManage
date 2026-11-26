import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS student_enrollment_one_active_per_user');

  await knex.schema.alterTable('student_enrollment', (table) => {
    table.unique(['user_id', 'batch_id'], {
      indexName: 'student_enrollment_active_user_batch_unique',
      predicate: knex.queryBuilder().where(knex.ref('is_active')).whereNotNull('batch_id'),
    });
    table.unique(['user_id'], {
      indexName: 'student_enrollment_active_user_section_unique',
      predicate: knex.queryBuilder().where(knex.ref('is_active')).whereNotNull('section_id'),
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS student_enrollment_active_user_batch_unique');
  await knex.raw('DROP INDEX IF EXISTS student_enrollment_active_user_section_unique');

  await knex.schema.alterTable('student_enrollment', (table) => {
    table.unique(['user_id'], {
      indexName: 'student_enrollment_one_active_per_user',
      predicate: knex.queryBuilder().where(knex.ref('is_active')),
    });
  });
}
