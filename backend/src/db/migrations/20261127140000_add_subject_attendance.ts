import type { Knex } from 'knex';
import { randomUUID } from 'crypto';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('student_attendence_table', table => {
    table.uuid('teacher_user_id').nullable().references('id').inTable('users_table');
    table.uuid('subject_id').nullable().references('id').inTable('subjects_table');
    for (const group of ['section_id', 'batch_id']) {
      table.unique(['org_student_id', 'subject_id', 'attendence_date', group], {
        indexName: `student_attendance_unique_${group}`,
      });
    }
  });

  const permission = 'mark_student_attendance';
  await knex('permissions_table').insert({ id: randomUUID(), permission }).onConflict('permission').ignore();
  const entry = await knex('permissions_table').where({ permission }).first('id');
  const role = await knex('roles_table').where({ role_name: 'teacher' }).first('id');
  if (role && entry) {
    await knex('role_permissions_table').insert({ id: randomUUID(), role_id: role.id, permission_id: entry.id })
      .onConflict(['role_id', 'permission_id']).ignore();
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('student_attendence_table', table => {
    table.dropColumns('teacher_user_id', 'subject_id');
  });
  await knex('permissions_table').where({ permission: 'mark_student_attendance' }).del();
}
