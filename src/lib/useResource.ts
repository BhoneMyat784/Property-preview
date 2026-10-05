import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "./api";
export function useResource<T>(path: string, initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initial);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError((e as Error).message);
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(!initial);
      setError("");
      api<T>(path)
        .then((v) => {
          if (active) setData(v);
        })
        .catch((e) => {
          if (active) {
            setError(e.message);
            setData(undefined);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [path]),
  );
  return { data, error, loading, refresh };
}
