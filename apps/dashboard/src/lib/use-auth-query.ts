import { useAuth } from "@clerk/nextjs";
import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

export function useAuthQuery<T>(
  queryKey: readonly unknown[],
  queryFn: (token: string) => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  const { getToken } = useAuth();

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return queryFn(token);
    },
    ...options,
  });
}

export { useQueryClient };
