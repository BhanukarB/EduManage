import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('student_enrollment', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('class_id').notNullable();
    table.uuid('section_id').nullable();
    table.uuid('academic_session_id').notNullable();
    table.date('enrollment_date').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.unique(['user_id'], {
      indexName: 'student_enrollment_one_active_per_user',
      predicate: knex.queryBuilder().where(knex.ref('is_active')),
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('student_enrollment');
}
