export interface JwtPayload {
  uid: string;
  email: string;
  role_ids?: string[];
  orgId?: string | null;
}
// TODO: remove this file if not needed
