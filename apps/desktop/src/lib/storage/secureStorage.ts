import { isTauri, tauriInvoke } from '../../bootstrap/tauri-bridge';

const STORAGE_KEY = 'smart_retail_os_auth_session';

export interface AuthSessionStorageEntry {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    companyId?: string;
  } | null;
}

function parseStoredSession(value: string | null): AuthSessionStorageEntry | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthSessionStorageEntry;
    if (typeof parsed.token !== 'string') {
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
    };
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<AuthSessionStorageEntry | null> {
  if (!isTauri()) {
    return parseStoredSession(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
    );
  }

  try {
    const session = await tauriInvoke<AuthSessionStorageEntry | null>('get_auth_session');
    return session;
  } catch {
    return null;
  }
}

export function getAuthSessionSync(): AuthSessionStorageEntry | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parseStoredSession(localStorage.getItem(STORAGE_KEY));
}

export async function setAuthSessionInStorage(session: AuthSessionStorageEntry): Promise<void> {
  if (!isTauri()) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    return;
  }

  try {
    await tauriInvoke<void>('save_auth_session', { session });
  } catch {
    // Fall back to browser storage when native persistence fails.
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }
}

export async function removeAuthSession(): Promise<void> {
  if (!isTauri()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }

  try {
    await tauriInvoke<void>('clear_auth_session');
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
