type RoleWithPermissions = {
  name: string;
  permissions: Array<{ permission: { code: string } }>;
};

export type UserWithRole = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  rewardPoints: number;
  storeCredit: number;
  role: RoleWithPermissions;
};

export function toPublicUser(user: UserWithRole) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    rewardPoints: user.rewardPoints,
    storeCredit: user.storeCredit,
    role: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.code),
  };
}

export const userRoleInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  },
} as const;
