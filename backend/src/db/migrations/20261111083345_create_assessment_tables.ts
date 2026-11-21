import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {

  await knex.schema.createTable('assessments_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('internal_id').notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id');
    table.uuid('academic_session_id');
    table.uuid('class_id');
    table.uuid('subject_id');
    table.string('assessment_name').notNullable();
    table.integer('assessment_type').notNullable(); // 1: ANNUAL_EXAM, 2: ASSIGNMENT, 3: CHAPTER_TEST, 4: MOCK_TEST, 5. HOMEWORK
    table.text('description');
    table.decimal('total_marks', 10, 2).notNullable();
    table.decimal('passing_marks', 10, 2).notNullable();
    table.integer('duration_minutes');
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
  });

  await knex.schema.createTable('assessment_targets_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('assessment_id').notNullable();
    table.uuid('section_id');
    table.uuid('batch_id');// either 
    table.uuid('assigned_by').notNullable();
    table.timestamp('assigned_at').notNullable().defaultTo(knex.fn.now());
    table.string('status').notNullable();
  });

  await knex.schema.createTable('assessment_questions_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('assessment_id').notNullable();
    table.uuid('question_id').notNullable();
    table.text('question_text_snapshot').notNullable();
    table.integer('question_type').notNullable(); //1: Objective single correct, 2: Objective multiple correct, 3: Subjective 4: true/false 5. numerical
    table.jsonb('options_snapshot');
    table.jsonb('correct_answer_snapshot');
    table.decimal('marks', 10, 2).notNullable();
    table.decimal('negative_marks', 10, 2);
    table.integer('sequence_number').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('question_bank_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('subject_id').notNullable();
    table.uuid('topic_id');
    table.text('question_text').notNullable();
    table.integer('question_type').notNullable(); //1: Objective single correct, 2: Objective multiple correct, 3: Subjective 4: true/false 5. numerical
    table.integer('difficulty_level').notNullable();
    table.decimal('default_marks', 10, 2).notNullable();
    table.text('explanation');
    table.jsonb('options');
    table.jsonb('correct_answer');
    table.uuid('created_by').notNullable();
    table.integer('status').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

}

// ---------------------------------------------------------------------------
// down – drop tables in reverse dependency order
// ---------------------------------------------------------------------------
export async function down(knex: Knex): Promise<void> {

  await knex.schema.dropTableIfExists('question_bank_table');
  await knex.schema.dropTableIfExists('assessment_questions_table');
  await knex.schema.dropTableIfExists('assessment_targets_table');
  await knex.schema.dropTableIfExists('assessments_table');
}
