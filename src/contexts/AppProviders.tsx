
import React from "react";
import { NotificationProvider } from "./NotificationContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configure the Query Client with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  );
}
