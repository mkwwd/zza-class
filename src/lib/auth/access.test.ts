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

  it('keeps the first episode public and later episodes rental-only', () => {
    const unrentedAdminEpisode = {
      isRented: false,
      role: 'admin' as const,
      sortOrder: 3,
    };

    expect(
      canViewLessonContent({
        isRented: false,
        sortOrder: 1,
      }),
    ).toBe(true);
    expect(
      canViewLessonContent({
        isRented: false,
        sortOrder: 2,
      }),
    ).toBe(false);
    expect(
      canViewLessonContent({
        isRented: true,
        sortOrder: 2,
      }),
    ).toBe(true);
    expect(canViewLessonContent(unrentedAdminEpisode)).toBe(false);
  });

  it('redirects missing users to login', () => {
    expect(getAuthenticatedRedirect()).toBe('/');
    expect(getAuthenticatedRedirect(null)).toBe('/');
    expect(getAuthenticatedRedirect('user-1')).toBeNull();
  });
});
