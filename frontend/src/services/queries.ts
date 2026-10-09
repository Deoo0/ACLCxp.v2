import { QueryClient, useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import api from "./api";
import { queryPolicy, mutationResources, queryAffected } from "./queryPolicy";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: false,
    },
  },
});
export type Row = { id: number; [key: string]: unknown };
export interface PageData<T = Row> {
  count: number;
  next: string | null;
  previous: string | null;
  data: T[];
}
export function useApi<T>(path: string, enabled = true, options?: { keepPreviousData?: boolean }) {
  return useQuery({
    queryKey: [path],
    enabled,
    ...queryPolicy(path),
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
    queryFn: async ({ signal }) => (await api.get<T>(path, { signal })).data,
  });
}
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      const flatten = (value: unknown): string =>
        typeof value === "string"
          ? value
          : Array.isArray(value)
            ? value.map(flatten).join(" ")
            : value && typeof value === "object"
              ? Object.entries(value)
                  .map(([key, val]) => `${key}: ${flatten(val)}`)
                  .join("; ")
              : String(value);
      return flatten(data.detail || data.message || data.errors || data);
    }
    return error.code === "ECONNABORTED"
      ? "The request timed out. Refresh before retrying."
      : "Cannot reach the server. Check your connection and try again.";
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function useWrite() {
  return useMutation({
    mutationFn: async ({
      path,
      body,
      method = "post",
    }: {
      path: string;
      body?: unknown;
      method?: "post" | "patch" | "delete";
    }) => (await api.request({ url: path, method, data: body, ...(body instanceof FormData ? { headers: { "Content-Type": undefined } } : {}) })).data,
    onSuccess: (_data, { path }) => invalidateMutation(path),
  });
}
export function invalidateMutation(path: string) {
  const resources = mutationResources(path);
  return queryClient.invalidateQueries({ predicate: query => queryAffected(query.queryKey, resources) });
}
export const valueText = (value: unknown) =>
  value == null || value === ""
    ? "-"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value);
