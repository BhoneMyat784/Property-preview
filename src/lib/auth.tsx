import React, { createContext, useContext, useEffect, useState } from "react";
import { api, authRequest, ApiError } from "./api";
import type { Me } from "../shared/contracts";
const Context = createContext<{
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      setUser(await api<Me>("/me"));
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401)
        console.warn("Session unavailable");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function logout() {
    await authRequest("sign-out", {});
    setUser(null);
  }
  return (
    <Context.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
