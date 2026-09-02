import { describe, expect, it } from 'vitest';

import {
  canManageCourses,
  canViewLessonContent,
  getAuthenticatedRedirect,
  isAdmin,
} from './access';

describe('access helpers', () => {
  it('treats only admin role as admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('user')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('allows only admins to manage courses', () => {
    expect(canManageCourses('admin')).toBe(true);
    expect(canManageCourses('user')).toBe(false);
    expect(canManageCourses(undefined)).toBe(false);
  });

  it('allows lesson content for admins or enrolled users only', () => {
    expect(canViewLessonContent({ role: 'admin', isEnrolled: false })).toBe(
      true,
    );
    expect(canViewLessonContent({ role: 'user', isEnrolled: true })).toBe(true);
    expect(canViewLessonContent({ role: 'user', isEnrolled: false })).toBe(
      false,
    );
    expect(canViewLessonContent({ role: null, isEnrolled: false })).toBe(false);
  });

  it('redirects missing users to login', () => {
    expect(getAuthenticatedRedirect()).toBe('/');
    expect(getAuthenticatedRedirect(null)).toBe('/');
    expect(getAuthenticatedRedirect('user-1')).toBeNull();
  });
});
