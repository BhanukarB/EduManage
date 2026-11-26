import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('class_subjects_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('class_id').notNullable();
    table.uuid('subject_id').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('section_id').nullable();
    table.uuid('batch_id').nullable();
    // Preserve the names PostgreSQL retained when the scheduling columns were renamed.
    table.specificType('class_start_time', 'time CONSTRAINT class_subjects_table_duty_start_time_not_null NOT NULL');
    table.specificType('class_end_time', 'time CONSTRAINT class_subjects_table_duty_end_time_not_null NOT NULL');
    table.check('(section_id IS NULL) <> (batch_id IS NULL)', [], 'class_subject_one_group');
    table.check('class_start_time < class_end_time', [], 'class_subject_valid_slot');
  });

  await knex.schema.createTable('section_subjects_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('section_id').notNullable();
    table.uuid('subject_id').notNullable();
    table.uuid('teacher_user_id').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('batch_subjects_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('batch_id').notNullable();
    table.uuid('subject_id').notNullable();
    table.uuid('teacher_user_id').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('teacher_class_table', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users_table').onDelete('CASCADE');
    table.uuid('class_subject_id').notNullable().references('id').inTable('class_subjects_table').onDelete('CASCADE');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'class_subject_id']);
  });

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
    table.uuid('batch_id').nullable().references('id').inTable('batches_table');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('student_enrollment');
  await knex.schema.dropTable('teacher_class_table');
  await knex.schema.dropTable('batch_subjects_table');
  await knex.schema.dropTable('section_subjects_table');
  await knex.schema.dropTable('class_subjects_table');
}
