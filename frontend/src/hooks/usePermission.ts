import { useAppSelector } from "../store";

// Định nghĩa quyền cho các Role khác nhau
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  HR_ADMIN: [
    "employee:read", "employee:write",
    "organization:read", "organization:write",
    "attendance:read", "attendance:adjust", "attendance:export",
    "leave:read", "leave:approve", "leave:report",
    "payroll:read", "payroll:run", "payroll:publish", "payroll:export",
    "performance:read", "performance:write",
    "recruitment:read", "recruitment:write",
    "report:read"
  ],
  HR_STAFF: [
    "employee:read", "employee:write",
    "organization:read",
    "attendance:read",
    "leave:read",
    "payroll:read",
    "recruitment:read", "recruitment:write",
    "report:read"
  ],
  MANAGER: [
    "employee:read",
    "attendance:read",
    "leave:read", "leave:approve",
    "performance:read", "performance:write"
  ],
  RECRUITER: [
    "recruitment:read", "recruitment:write"
  ],
  EMPLOYEE: [
    "employee:self",
    "attendance:me",
    "leave:me",
    "payroll:me",
    "performance:me"
  ]
};

export const usePermission = () => {
  const user = useAppSelector((state) => state.auth.user);

  const can = (permission: string): boolean => {
    if (!user || !user.roles) return false;

    // SUPER_ADMIN có toàn bộ quyền
    if (user.roles.includes("SUPER_ADMIN")) return true;

    // Duyệt qua các role của user để kiểm tra quyền
    for (const role of user.roles) {
      const permissions = ROLE_PERMISSIONS[role];
      if (permissions) {
        if (permissions.includes("*") || permissions.includes(permission)) {
          return true;
        }
      }
    }

    return false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((role) => roles.includes(role));
  };

  return { can, hasAnyRole, userRoles: user?.roles || [] };
};
