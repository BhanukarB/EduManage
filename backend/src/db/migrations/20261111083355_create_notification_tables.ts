import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').notNullable();
    table.uuid('recipient_user_id').notNullable();
    table.text('message').notNullable();
    table.integer('notification_type').notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notification_templates_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('org_id').nullable();
    table.string('template_code').notNullable().unique();
    table.string('title_template').notNullable();
    table.text('message_template').notNullable();
    table.integer('channel').notNullable();
    table.integer('status').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notification_deliveries_table', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('notification_id').notNullable();
    table.integer('channel').notNullable();
    table.string('recipient_address').notNullable();
    table.integer('status').notNullable();
    table.string('provider_message_id').nullable();
    table.integer('retry_count').notNullable().defaultTo(0);
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

}

// ---------------------------------------------------------------------------
// down – drop tables in reverse dependency order
// ---------------------------------------------------------------------------
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_deliveries_table');
  await knex.schema.dropTableIfExists('notification_templates_table');
  await knex.schema.dropTableIfExists('notifications_table');
}
