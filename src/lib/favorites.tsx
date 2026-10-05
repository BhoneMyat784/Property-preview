import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { api } from "./api";
import { useAuth } from "./auth";
import type { Listing } from "../shared/contracts";
const Context = createContext<{
  ids: Set<string>;
  toggle: (id: string) => Promise<void>;
}>({ ids: new Set(), toggle: async () => {} });
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set<string>());
  useEffect(() => {
    if (user)
      api<Listing[]>("/favorites")
        .then((rows) => setIds(new Set(rows.map((r) => r.id))))
        .catch(() => {});
    else setIds(new Set());
  }, [user?.id]);
  async function toggle(id: string) {
    if (!user) {
      router.push("/auth");
      return;
    }
    const exists = ids.has(id);
    await api(`/favorites/${id}`, { method: exists ? "DELETE" : "PUT" });
    setIds((previous) => {
      const next = new Set(previous);
      if (exists) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <Context.Provider value={{ ids, toggle }}>{children}</Context.Provider>
  );
}
export const useFavorites = () => useContext(Context);
