export type Role = 'admin' | 'user';

export function isAdmin(role: Role | null | undefined) {
  return role === 'admin';
}

export function canManageCourses(role: Role | null | undefined) {
  return isAdmin(role);
}

export function canViewLessonContent({
  role,
  isEnrolled,
}: {
  role?: Role | null;
  isEnrolled: boolean;
}) {
  return isAdmin(role) || isEnrolled;
}

export function getAuthenticatedRedirect(userId?: string | null) {
  return userId ? null : '/';
}
