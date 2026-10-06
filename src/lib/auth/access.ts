export type Role = 'admin' | 'user';

export function isAdmin(role: Role | null | undefined) {
  return role === 'admin';
}

export function canManageCourses(role: Role | null | undefined) {
  return isAdmin(role);
}

export function canViewLessonContent({
  isRented,
  role,
  sortOrder,
}: {
  isRented: boolean;
  role?: Role | null;
  sortOrder: number;
}) {
  return sortOrder === 1 || isAdmin(role) || isRented;
}

export function getAuthenticatedRedirect(userId?: string | null) {
  return userId ? null : '/';
}
