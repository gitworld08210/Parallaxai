import '@/i18n';
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { reportError } from "@/lib/errorReporting";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Register global error handlers before rendering
window.addEventListener("error", (event) => {
  if (event.error instanceof Error) {
    reportError(event.error, { page: window.location.pathname });
  } else {
    reportError(new Error(event.message || "Unknown error"), {
      page: window.location.pathname,
    });
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason || "Unhandled promise rejection"));
  reportError(error, { page: window.location.pathname });
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
