import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('branch_classes_table', (table) => {
    table.uuid('id').primary();
    table.uuid('org_id').notNullable();
    table.uuid('branch_id').notNullable();
    table.uuid('class_id').notNullable();
    table.timestamps(true, true);
    table.unique(['branch_id', 'class_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('branch_classes_table');
}
