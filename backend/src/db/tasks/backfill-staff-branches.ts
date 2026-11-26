import db from '../connector/knex';
import { RoleType } from '../../utils/enums/roleType';

interface GrantException {
  assignmentId: string;
  reason: string;
}

interface BackfillResult {
  grantsMatched: number;
  exceptions: GrantException[];
}

export async function backfillStaffBranches(): Promise<BackfillResult> {
  return db.transaction(async trx => {
    const result: BackfillResult = { grantsMatched: 0, exceptions: [] };
    const profiles = await trx('organisation_staff_table as s')
      .join('branches as b', function () {
        this.on('s.branch_id', 'b.id').andOn('s.org_id', 'b.org_id');
      })
      .select('s.org_id', 's.user_id', 's.branch_id', 's.status');
    const assignments = await trx('user_roles_table as ur')
      .join('roles_table as r', 'ur.role_id', 'r.id').whereNull('ur.branch_id')
      .select('ur.id', 'ur.user_id', 'ur.org_id', 'r.role_name', 'r.role_type');
    for (const grant of assignments) {
      if (grant.role_type === RoleType.GLOBAL && !grant.org_id) continue;
      if (grant.role_type === RoleType.ORG_LEVEL && grant.org_id) continue;
      if (grant.role_name === 'student' && grant.org_id) continue;
      if (grant.role_type !== RoleType.BRANCH_LEVEL || !grant.org_id) {
        result.exceptions.push({ assignmentId: grant.id, reason: 'Role type or organisation requires review' });
        continue;
      }
      const existing = await trx('user_roles_table').where({ org_id: grant.org_id, user_id: grant.user_id })
        .whereNotNull('branch_id').pluck('branch_id');
      const profile = profiles.find(row => row.org_id === grant.org_id && row.user_id === grant.user_id);
      const matches = [...new Set(profile ? [...existing, profile.branch_id] : existing)];

      if (matches.length !== 1) {
        result.exceptions.push({ assignmentId: grant.id, reason: matches.length ? 'Ambiguous branch' : 'Missing staff branch' });
        continue;
      }
      result.grantsMatched += await trx('user_roles_table').where({ id: grant.id }).whereNull('branch_id').update({ branch_id: matches[0], is_active: profile?.status === 1, is_deleted: profile?.status === 2 });
    }
    return result;
  });
}

if (require.main === module) {
  backfillStaffBranches().then(result => console.log(JSON.stringify(result, null, 2)))
    .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
    .finally(() => db.destroy());
}
