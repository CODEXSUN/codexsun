import "@codexsun/ui/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 15_000, refetchOnWindowFocus: false } } });
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
