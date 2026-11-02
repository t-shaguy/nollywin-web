import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminRole = "ADMIN" | "AUTH" | null;
type LoginPath = "admin" | "fallback";

interface AdminAuthState {
  session: { 
    token: string; 
    admin: { email: string }; 
    role: AdminRole;
    loginPath?: LoginPath; // TEMP: remove once groups is always present
  } | null;
  setSession: (token: string, admin: { email: string }, loginResponse?: Record<string, unknown>, loginPath?: LoginPath) => void;
  logout: () => void;
}

/**
 * Decode JWT payload (claims)
 * Returns null if invalid
 */
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract admin role from JWT token's groups claim (PRIMARY) or fallback sources
 * 
 * Primary: JWT payload `groups` array (lowercase strings)
 *   - includes "auth" → AUTH (checker)
 *   - includes "admin" → ADMIN (maker)
 *   - includes both → ADMIN (maker takes precedence)
 * 
 * Secondary: role/roles/authorities/scope fields
 * 
 * TEMP: If no role found and loginPath is "fallback", treat as AUTH
 */
function getAdminRole(loginResponse: Record<string, unknown> | undefined, token: string, loginPath?: LoginPath): AdminRole {
  // TEMP DEV LOGGING: Remove after verifying groups claim works
  if (process.env.NODE_ENV === 'development') {
    const payload = decodeJWTPayload(token);
    console.debug('[getAdminRole] JWT payload:', payload);
    console.debug('[getAdminRole] Login path:', loginPath);
  }

  // PRIMARY SOURCE: JWT payload groups claim
  const payload = decodeJWTPayload(token);
  if (payload && Array.isArray(payload.groups)) {
    const groups = payload.groups.map(g => String(g).toLowerCase());
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[getAdminRole] Found groups:', groups);
    }
    
    // Both present → ADMIN takes precedence
    if (groups.includes('admin')) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[getAdminRole] Role determined: ADMIN (from groups claim)');
      }
      return 'ADMIN';
    }
    
    if (groups.includes('auth')) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[getAdminRole] Role determined: AUTH (from groups claim)');
      }
      return 'AUTH';
    }
  }

  // SECONDARY SOURCES: Check login response and other JWT claims
  // Check login response first
  if (loginResponse) {
    // Direct role field
    if (typeof loginResponse.role === 'string') {
      const role = loginResponse.role.toUpperCase().replace('ROLE_', '');
      if (role === 'ADMIN' || role === 'AUTH') {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[getAdminRole] Role determined:', role, '(from login response.role)');
        }
        return role;
      }
    }
    
    // roles array
    if (Array.isArray(loginResponse.roles)) {
      for (const r of loginResponse.roles) {
        const role = String(r).toUpperCase().replace('ROLE_', '');
        if (role === 'ADMIN' || role === 'AUTH') {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[getAdminRole] Role determined:', role, '(from login response.roles)');
          }
          return role;
        }
      }
    }
    
    // authorities array (Spring Security format)
    if (Array.isArray(loginResponse.authorities)) {
      for (const auth of loginResponse.authorities) {
        const authority = typeof auth === 'string' ? auth : auth?.authority;
        if (authority) {
          const role = String(authority).toUpperCase().replace('ROLE_', '');
          if (role === 'ADMIN' || role === 'AUTH') {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[getAdminRole] Role determined:', role, '(from login response.authorities)');
            }
            return role;
          }
        }
      }
    }
    
    // scope string
    if (typeof loginResponse.scope === 'string') {
      const role = loginResponse.scope.toUpperCase().replace('ROLE_', '');
      if (role === 'ADMIN' || role === 'AUTH') {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[getAdminRole] Role determined:', role, '(from login response.scope)');
        }
        return role;
      }
    }
  }

  // Check other JWT claims
  if (payload) {
    // Direct role claim
    if (typeof payload.role === 'string') {
      const role = payload.role.toUpperCase().replace('ROLE_', '');
      if (role === 'ADMIN' || role === 'AUTH') {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[getAdminRole] Role determined:', role, '(from JWT payload.role)');
        }
        return role;
      }
    }
    
    // roles array claim
    if (Array.isArray(payload.roles)) {
      for (const r of payload.roles) {
        const role = String(r).toUpperCase().replace('ROLE_', '');
        if (role === 'ADMIN' || role === 'AUTH') {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[getAdminRole] Role determined:', role, '(from JWT payload.roles)');
          }
          return role;
        }
      }
    }
    
    // authorities claim
    if (Array.isArray(payload.authorities)) {
      for (const auth of payload.authorities) {
        const authority = typeof auth === 'string' ? auth : auth?.authority;
        if (authority) {
          const role = String(authority).toUpperCase().replace('ROLE_', '');
          if (role === 'ADMIN' || role === 'AUTH') {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[getAdminRole] Role determined:', role, '(from JWT payload.authorities)');
            }
            return role;
          }
        }
      }
    }
    
    // scope claim
    if (typeof payload.scope === 'string') {
      const scopes = payload.scope.split(' ');
      for (const scope of scopes) {
        const role = scope.toUpperCase().replace('ROLE_', '');
        if (role === 'ADMIN' || role === 'AUTH') {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[getAdminRole] Role determined:', role, '(from JWT payload.scope)');
          }
          return role;
        }
      }
    }
  }

  // TEMP: remove once groups is always present
  // Fallback login path → treat as AUTH
  if (loginPath === 'fallback') {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[getAdminRole] Role determined: AUTH (from fallback login path - TEMP)');
    }
    return 'AUTH';
  }

  // Unknown role - treat as ADMIN (full menu) for safety
  if (process.env.NODE_ENV === 'development') {
    console.warn('[getAdminRole] No valid role found, treating as ADMIN (full access)');
  }
  
  return null; // Treated as ADMIN
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (token, admin, loginResponse, loginPath) => {
        const role = getAdminRole(loginResponse, token, loginPath);
        set({ session: { token, admin, role, loginPath } });
      },
      logout: () => set({ session: null }),
    }),
    {
      name: "nollywin-admin-auth",
      // Re-derive role from token on hydration if missing
      onRehydrateStorage: () => (state) => {
        if (state?.session && !state.session.role) {
          const role = getAdminRole(undefined, state.session.token, state.session.loginPath);
          state.session.role = role;
        }
      },
    }
  )
);
