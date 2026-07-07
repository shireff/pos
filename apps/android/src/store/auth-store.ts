export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  companyId: string;
  defaultBranchId: string | null;
  isActive: boolean;
}

export interface AuthState {
  currentUser: AuthUserSnapshot | null;
  accessToken: string | null;
  branchRoles: string[];
  isAuthenticated: boolean;
  isOffline: boolean;
}

export type AuthAction =
  | {
      type: 'auth/set-session';
      payload: {
        currentUser: AuthUserSnapshot;
        accessToken: string;
        branchRoles: string[];
        isAuthenticated: boolean;
      };
    }
  | { type: 'auth/clear-session' }
  | { type: 'auth/set-offline'; payload: boolean };

const initialState: AuthState = {
  currentUser: null,
  accessToken: null,
  branchRoles: [],
  isAuthenticated: false,
  isOffline: false,
};

export function authReducer(state: AuthState = initialState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'auth/set-session':
      return {
        ...state,
        currentUser: action.payload.currentUser,
        accessToken: action.payload.accessToken,
        branchRoles: action.payload.branchRoles,
        isAuthenticated: action.payload.isAuthenticated,
      };
    case 'auth/clear-session':
      return {
        ...state,
        currentUser: null,
        accessToken: null,
        branchRoles: [],
        isAuthenticated: false,
      };
    case 'auth/set-offline':
      return {
        ...state,
        isOffline: action.payload,
      };
    default:
      return state;
  }
}

export function setAuthSession(payload: {
  currentUser: AuthUserSnapshot;
  accessToken: string;
  branchRoles: string[];
  isAuthenticated: boolean;
}): AuthAction {
  return { type: 'auth/set-session', payload };
}

export function clearAuthSession(): AuthAction {
  return { type: 'auth/clear-session' };
}

export function setOfflineStatus(isOffline: boolean): AuthAction {
  return { type: 'auth/set-offline', payload: isOffline };
}
