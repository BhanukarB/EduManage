export interface Organisation {
  id: string;
  name: string;
  tagline?: string | null;
  type: number;
  emailId: string;
  phoneNumber?: string | null;
  address?: Record<string, unknown> | null;
  status: number;
}

export interface Branch {
  id: string;
  orgId: string;
  branchName: string;
  branchCode: string;
  type: number;
  emailId: string;
  phoneNumber?: string | null;
  address?: Record<string, unknown> | null;
  status: number;
}

export interface Staff {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber?: string | null;
  branchId: string | null;
  designation: string;
  status: number;
}

export interface Role {
  id: string;
  name: string;
  roleType?: number | null;
  permission_count?: number;
}

export interface Permission {
  id: string;
  permission: string;
}
