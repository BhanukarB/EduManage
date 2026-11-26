import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('organisations', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('name').notNullable();
    table.string('tagline').nullable();
    table.integer('type').notNullable(); // SCHOOL: 1 / COACHING: 2
    table.text('email_id').notNullable();
    table.string('phone_number').nullable();
    table.text('logo');
    table.jsonb('address').nullable();
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1/ INACTIVE: 0
    table.timestamps(true, true);
  });

  await knex.schema.createTable('academic_sessions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.string('session_name');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('branches', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.string('branch_name').notNullable();
    table.string('branch_code').notNullable();
    table.integer('type').notNullable(); // SCHOOL: 1 / COACHING: 2
    table.text('email_id').notNullable();
    table.string('phone_number').nullable();
    table.jsonb('address').nullable();
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1/ INACTIVE: 0
    table.timestamps(true, true);
    table.unique(['org_id', 'id']);
  });

  await knex.schema.createTable('classes', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.string('class_name').notNullable();
    table.string('class_code').notNullable();
    table.text('description').nullable();
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1/ INACTIVE: 0
    table.timestamps(true, true);
  });

  await knex.schema.createTable('sections_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('class_id').notNullable();
    table.uuid('academic_session_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.string('section_code').notNullable();
    table.integer('capacity').notNullable();
    table.string('daily_start_time');
    table.string('daily_end_time');
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1 / INACTIVE: 0
    table.timestamps(true, true);
  });

  await knex.schema.createTable('batches_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('academic_session_id').notNullable();
    table.uuid('class_id').notNullable();
    table.string('batch_code').notNullable();
    table.string('batch_name');
    table.string('daily_start_time');
    table.string('daily_end_time');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.integer('capacity').notNullable();
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1 / INACTIVE: 0
    table.timestamps(true, true);
  });

  await knex.schema.createTable('subjects_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('organisation_id').notNullable();
    table.string('subject_name').notNullable();
    table.string('subject_code').notNullable();
    table.text('description');
    table.integer('status').notNullable().defaultTo(1); // ACTIVE: 1 / INACTIVE: 0
    table.timestamps(true, true);
  });

  await knex.schema.createTable('branch_classes_table', (table) => {
    table.uuid('id').primary();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('class_id').notNullable();
    table.timestamps(true, true);
    table.unique(['branch_id', 'class_id']);
  });

  await knex.schema.createTable('branch_subjects_table', (table) => {
    table.uuid('id').primary();
    table.uuid('branch_id').notNullable().references('id').inTable('branches');
    table.uuid('subject_id').notNullable().references('id').inTable('subjects_table');
    table.unique(['branch_id', 'subject_id']);
  });

  await knex.schema.createTable('organisation_student_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('academic_session_id').notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('class_id').notNullable();
    table.uuid('section_id');
    table.uuid('batch_id');
    table.string('enrollment_number').notNullable();
    table.date('enrollment_date').notNullable();
    table.integer('status').notNullable().defaultTo(1);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('organisation_staff_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id');
    table.uuid('user_id').notNullable();
    table.string('designation').notNullable();
    table.date('joining_date').notNullable();
    table.date('leaving_date').nullable();
    table.timestamps(true, true);
    table.integer('status').notNullable().defaultTo(1);
    table.unique(['org_id', 'user_id']);
  });

  await knex.schema.createTable('student_attendence_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_student_id').notNullable();
    table.uuid('user_id').notNullable();
    table.date('attendence_date').notNullable();
    table.uuid('section_id');
    table.uuid('batch_id'); // at least 1 of section_id and batch_id must be present
    table.time('entry_time').nullable();
    table.time('exit_time').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('staff_attendence_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_staff_id').notNullable();
    table.uuid('user_id').notNullable();
    table.date('attendence_date').notNullable();
    table.uuid('section_id');
    table.uuid('batch_id'); // section_id and batch_id may be absent
    table.time('entry_time').nullable();
    table.time('exit_time').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('student_guardian_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('student_user_id').notNullable();
    table.uuid('guardian_user_id').notNullable();
    table.string('relation_type').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('student_guardian_table');
  await knex.schema.dropTable('staff_attendence_table');
  await knex.schema.dropTable('student_attendence_table');
  await knex.schema.dropTable('organisation_staff_table');
  await knex.schema.dropTable('organisation_student_table');
  await knex.schema.dropTable('branch_subjects_table');
  await knex.schema.dropTable('branch_classes_table');
  await knex.schema.dropTable('subjects_table');
  await knex.schema.dropTable('batches_table');
  await knex.schema.dropTable('sections_table');
  await knex.schema.dropTable('classes');
  await knex.schema.dropTable('branches');
  await knex.schema.dropTable('academic_sessions_table');
  await knex.schema.dropTable('organisations');
}
