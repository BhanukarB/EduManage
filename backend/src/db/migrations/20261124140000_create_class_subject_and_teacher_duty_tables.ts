import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teacher_class_table', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.uuid('class_subject_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('teacher_class_table');
}
