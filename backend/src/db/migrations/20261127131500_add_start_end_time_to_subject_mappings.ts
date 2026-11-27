import type { Knex } from 'knex';

const tables = ['section_subjects_table', 'batch_subjects_table'] as const;

export async function up(knex: Knex): Promise<void> {
  for (const tableName of tables) {
    const hasStartTime = await knex.schema.hasColumn(tableName, 'start_time');
    const hasEndTime = await knex.schema.hasColumn(tableName, 'end_time');
    if (!hasStartTime || !hasEndTime) {
      await knex.schema.alterTable(tableName, (table) => {
        if (!hasStartTime) table.time('start_time').nullable();
        if (!hasEndTime) table.time('end_time').nullable();
      });
    }
    await knex.raw(
      `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_valid_time_slot`,
    );
    await knex.raw(
      `ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_valid_time_slot CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)`,
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of tables) {
    await knex.raw(
      `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_valid_time_slot`,
    );
    const hasStartTime = await knex.schema.hasColumn(tableName, 'start_time');
    const hasEndTime = await knex.schema.hasColumn(tableName, 'end_time');
    if (hasStartTime || hasEndTime) {
      await knex.schema.alterTable(tableName, (table) => {
        if (hasStartTime) table.dropColumn('start_time');
        if (hasEndTime) table.dropColumn('end_time');
      });
    }
  }
}
