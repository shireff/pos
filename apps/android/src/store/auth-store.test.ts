import { describe, expect, it } from 'vitest';
import { authReducer, clearAuthSession, setAuthSession, setOfflineStatus } from './auth-store';

describe('auth store', () => {
  it('stores a session in memory without persisting the token', () => {
    const state = authReducer(
      undefined,
      setAuthSession({
        currentUser: {
          id: 'user-1',
          name: 'Ahmed',
          email: 'ahmed@example.com',
          companyId: 'company-1',
          defaultBranchId: 'branch-1',
          isActive: true,
        },
        accessToken: 'token-123',
        branchRoles: ['Owner'],
        isAuthenticated: true,
      }),
    );

    expect(state.currentUser?.email).toBe('ahmed@example.com');
    expect(state.accessToken).toBe('token-123');
    expect(state.isAuthenticated).toBe(true);
    expect(state.branchRoles).toEqual(['Owner']);
  });

  it('clears the session and updates offline status', () => {
    const state = authReducer(
      authReducer(
        undefined,
        setAuthSession({
          currentUser: {
            id: 'user-1',
            name: 'Ahmed',
            email: 'ahmed@example.com',
            companyId: 'company-1',
            defaultBranchId: 'branch-1',
            isActive: true,
          },
          accessToken: 'token-123',
          branchRoles: ['Owner'],
          isAuthenticated: true,
        }),
      ),
      setOfflineStatus(true),
    );

    const cleared = authReducer(state, clearAuthSession());

    expect(cleared.isOffline).toBe(true);
    expect(cleared.isAuthenticated).toBe(false);
    expect(cleared.accessToken).toBeNull();
    expect(cleared.currentUser).toBeNull();
  });
});
