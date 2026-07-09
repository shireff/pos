const STORAGE_KEY = 'smart_retail_os_auth_session';

export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  companyId: string;
  defaultBranchId: string | null;
  isActive: boolean;
}

export interface AuthSessionStorageEntry {
  accessToken: string;
  currentUser: AuthUserSnapshot;
  branchRoles: string[];
  isAuthenticated: boolean;
}

function parseStoredSession(value: string | null): AuthSessionStorageEntry | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthSessionStorageEntry;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.isAuthenticated !== 'boolean' ||
      !parsed.currentUser ||
      typeof parsed.currentUser.id !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      currentUser: parsed.currentUser,
      branchRoles: Array.isArray(parsed.branchRoles) ? parsed.branchRoles : [],
      isAuthenticated: parsed.isAuthenticated,
    };
  } catch {
    return null;
  }
}

async function getCapacitorPreferences(): Promise<typeof import('@capacitor/preferences') | null> {
  try {
    return await import('@capacitor/preferences');
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<AuthSessionStorageEntry | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const preferences = await getCapacitorPreferences();

  if (preferences?.Preferences) {
    try {
      const result = await preferences.Preferences.get({ key: STORAGE_KEY });
      return parseStoredSession(result.value ?? null);
    } catch {
      // fall through to localStorage fallback
    }
  }

  return parseStoredSession(localStorage.getItem(STORAGE_KEY));
}

export function getAuthSessionSync(): AuthSessionStorageEntry | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parseStoredSession(localStorage.getItem(STORAGE_KEY));
}

export async function setAuthSessionInStorage(session: AuthSessionStorageEntry): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = JSON.stringify(session);
  const preferences = await getCapacitorPreferences();

  if (preferences?.Preferences) {
    try {
      await preferences.Preferences.set({ key: STORAGE_KEY, value: payload });
      return;
    } catch {
      // fall back to localStorage
    }
  }

  localStorage.setItem(STORAGE_KEY, payload);
}

export async function removeAuthSession(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const preferences = await getCapacitorPreferences();

  if (preferences?.Preferences) {
    try {
      await preferences.Preferences.remove({ key: STORAGE_KEY });
      return;
    } catch {
      // fall back to localStorage
    }
  }

  localStorage.removeItem(STORAGE_KEY);
}
