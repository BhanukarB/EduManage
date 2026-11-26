import type { Knex } from 'knex';

export async function up(db: Knex): Promise<void> {
  if (await db.schema.hasTable('teacher_class_table')) return;
  await db.schema.createTable('teacher_class_table', table => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users_table').onDelete('CASCADE');
    table.uuid('class_subject_id').notNullable().references('id').inTable('class_subjects_table').onDelete('CASCADE');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    table.unique(['user_id', 'class_subject_id']);
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTableIfExists('teacher_class_table');
}
