"use client";

import { AccessToken, OktaAuth, UserClaims, toRelativeUrl } from "@okta/okta-auth-js";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { AuthUser } from "@/lib/types";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  configError: string | null;
  login: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  handleLoginCallback: () => Promise<void>;
  hasAnyGroup: (groups: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_BYPASS_GROUPS = ["SalesPortal_Admin", "SalesPortal_Sales", "SalesPortal_ReadOnly"];

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseBypassGroups(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_BYPASS_GROUPS;
  }

  const groups = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return groups.length > 0 ? groups : DEFAULT_BYPASS_GROUPS;
}

const AUTH_BYPASS_ENABLED = parseBooleanEnv(process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED);
const AUTH_BYPASS_TOKEN = process.env.NEXT_PUBLIC_AUTH_BYPASS_TOKEN || "local-dev-token";
const AUTH_BYPASS_USER: AuthUser = {
  name: process.env.NEXT_PUBLIC_AUTH_BYPASS_NAME || "Local Developer",
  email: process.env.NEXT_PUBLIC_AUTH_BYPASS_EMAIL || "local.dev@sales-portal.test",
  groups: parseBypassGroups(process.env.NEXT_PUBLIC_AUTH_BYPASS_GROUPS),
};

function createOktaAuthInstance(): OktaAuth | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (AUTH_BYPASS_ENABLED) {
    return null;
  }
  const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_OKTA_CLIENT_ID;
  if (!issuer || !clientId) {
    return null;
  }
  return new OktaAuth({
    issuer,
    clientId,
    redirectUri: `${window.location.origin}/login/callback`,
    scopes: ["openid", "profile", "email", "groups"],
    pkce: true,
    tokenManager: {
      storage: "memory",
      autoRenew: true,
      autoRemove: true,
    },
  });
}

function parseGroups(claims: UserClaims): string[] {
  const groupsValue = claims.groups;
  if (Array.isArray(groupsValue)) {
    return groupsValue.filter((item): item is string => typeof item === "string");
  }
  if (typeof groupsValue === "string" && groupsValue.length > 0) {
    return [groupsValue];
  }
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const oktaAuthRef = useRef<OktaAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  if (!oktaAuthRef.current) {
    oktaAuthRef.current = createOktaAuthInstance();
  }

  const refreshAuthState = useCallback(async () => {
    if (AUTH_BYPASS_ENABLED) {
      setIsAuthenticated(true);
      setUser(AUTH_BYPASS_USER);
      setAccessToken(AUTH_BYPASS_TOKEN);
      setConfigError(null);
      setIsLoading(false);
      return;
    }

    const oktaAuth = oktaAuthRef.current;
    if (!oktaAuth) {
      setConfigError(
        "Missing NEXT_PUBLIC_OKTA_ISSUER or NEXT_PUBLIC_OKTA_CLIENT_ID. Configure frontend Okta environment values.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const token = (await oktaAuth.tokenManager.get("accessToken")) as AccessToken | undefined;
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      const claims = await oktaAuth.getUser();
      const mappedUser: AuthUser = {
        name: typeof claims.name === "string" ? claims.name : undefined,
        email: typeof claims.email === "string" ? claims.email : undefined,
        groups: parseGroups(claims),
      };

      setIsAuthenticated(true);
      setUser(mappedUser);
      setAccessToken(token.accessToken);
      setConfigError(null);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (AUTH_BYPASS_ENABLED) {
      void refreshAuthState();
      return;
    }

    const oktaAuth = oktaAuthRef.current;
    if (!oktaAuth) {
      void refreshAuthState();
      return;
    }

    const handleTokensUpdated = () => {
      void refreshAuthState();
    };

    oktaAuth.tokenManager.on("added", handleTokensUpdated);
    oktaAuth.tokenManager.on("renewed", handleTokensUpdated);
    oktaAuth.tokenManager.on("removed", handleTokensUpdated);

    void refreshAuthState();

    return () => {
      oktaAuth.tokenManager.off("added", handleTokensUpdated);
      oktaAuth.tokenManager.off("renewed", handleTokensUpdated);
      oktaAuth.tokenManager.off("removed", handleTokensUpdated);
    };
  }, [refreshAuthState]);

  const login = useCallback(async (redirectPath?: string) => {
    if (AUTH_BYPASS_ENABLED) {
      setIsAuthenticated(true);
      setUser(AUTH_BYPASS_USER);
      setAccessToken(AUTH_BYPASS_TOKEN);
      setConfigError(null);
      window.location.assign(redirectPath ?? "/accounts");
      return;
    }

    const oktaAuth = oktaAuthRef.current;
    if (!oktaAuth) {
      throw new Error("Okta client is not configured.");
    }

    const target = redirectPath ?? `${window.location.pathname}${window.location.search}`;
    oktaAuth.setOriginalUri(target);
    await oktaAuth.signInWithRedirect();
  }, []);

  const logout = useCallback(async () => {
    if (AUTH_BYPASS_ENABLED) {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setConfigError(null);
      window.location.assign("/login");
      return;
    }

    const oktaAuth = oktaAuthRef.current;
    if (!oktaAuth) {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      window.location.assign("/login");
      return;
    }

    try {
      await oktaAuth.signOut({
        postLogoutRedirectUri: `${window.location.origin}/login`,
        revokeAccessToken: true,
        revokeRefreshToken: true,
      });
    } catch {
      await oktaAuth.tokenManager.clear();
      window.location.assign("/login");
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const handleLoginCallback = useCallback(async () => {
    if (AUTH_BYPASS_ENABLED) {
      setIsAuthenticated(true);
      setUser(AUTH_BYPASS_USER);
      setAccessToken(AUTH_BYPASS_TOKEN);
      setConfigError(null);
      window.location.replace("/accounts");
      return;
    }

    const oktaAuth = oktaAuthRef.current;
    if (!oktaAuth) {
      throw new Error("Okta client is not configured.");
    }

    if (!oktaAuth.isLoginRedirect()) {
      return;
    }

    await oktaAuth.handleRedirect();
    await refreshAuthState();

    const originalUri = oktaAuth.getOriginalUri() || "/accounts";
    oktaAuth.removeOriginalUri();
    window.location.replace(toRelativeUrl(originalUri, window.location.origin));
  }, [refreshAuthState]);

  const hasAnyGroup = useCallback(
    (groups: string[]) => {
      if (!user) {
        return false;
      }
      return groups.some((group) => user.groups.includes(group));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      accessToken,
      configError,
      login,
      logout,
      handleLoginCallback,
      hasAnyGroup,
    }),
    [isLoading, isAuthenticated, user, accessToken, configError, login, logout, handleLoginCallback, hasAnyGroup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
