import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSION_CODES,
  SYSTEM_ROLE_PERMISSION_MATRIX,
  canAccessPermission,
} from '@packages/shared-kernel';

describe('system permission matrix', () => {
  it('allows or denies each permission for every system role deterministically', () => {
    const roleNames = Object.keys(SYSTEM_ROLE_PERMISSION_MATRIX) as Array<
      keyof typeof SYSTEM_ROLE_PERMISSION_MATRIX
    >;

    expect(roleNames.length).toBeGreaterThan(0);

    for (const roleName of roleNames) {
      const permissions = SYSTEM_ROLE_PERMISSION_MATRIX[roleName];
      expect(permissions.length).toBeGreaterThan(0);

      for (const permissionCode of ALL_PERMISSION_CODES) {
        expect(canAccessPermission(roleName, permissionCode)).toBe(
          permissions.includes(permissionCode),
        );
      }
    }
  });
});
