import type { Knex } from 'knex';
import { randomUUID } from 'crypto';

export async function up(knex: Knex): Promise<void> {
  const sectionMappings = await knex('sections_table as s')
    .join('classes as c', 'c.id', 's.class_id')
    .distinct('c.org_id as org_id', 's.branch_id as branch_id', 's.class_id as class_id');
  const batchMappings = await knex('batches_table').distinct('org_id', 'branch_id', 'class_id');
  const uniqueMappings = new Map<string, { id: string; org_id: string; branch_id: string; class_id: string }>();
  for (const mapping of [...sectionMappings, ...batchMappings]) {
    const key = `${mapping.branch_id}:${mapping.class_id}`;
    if (!uniqueMappings.has(key)) uniqueMappings.set(key, { id: randomUUID(), ...mapping });
  }
  if (uniqueMappings.size) {
    await knex('branch_classes_table').insert([...uniqueMappings.values()]).onConflict(['branch_id', 'class_id']).ignore();
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Mapping rows may also be referenced by newly created branch classes, so leave them intact.
}
