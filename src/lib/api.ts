import type { Listing, ListingPage, Locations } from "../shared/contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return process.env.NODE_ENV === "development"
      ? process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001"
      : window.location.origin;
  }
  return (
    process.env.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://localhost:3001"
  );
}
export function photoUrl(url: string) {
  return url.startsWith("/") ? `${apiOrigin()}${url}` : url;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiOrigin()}/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      error?.error?.message || "Unable to connect. Please try again.",
    );
  }
  return response.json();
}
export async function authRequest(path: string, body: unknown) {
  const response = await fetch(`${apiOrigin()}/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      result?.message || "Account request failed. Please try again.",
    );
  return result;
}
export async function publicData<T>(path: string): Promise<T> {
  const origin =
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    "http://localhost:3001";
  const response = await fetch(`${origin}/api/v1${path}`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      response.status === 404
        ? "Listing not found"
        : "Unable to load properties",
    );
  return response.json();
}
export type HomeData = { listings: ListingPage; locations: Locations };
export type DetailData = { listing: Listing | null };
