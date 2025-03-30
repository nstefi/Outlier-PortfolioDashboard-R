import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Define error handler for unhandled errors
const handleError = (event: ErrorEvent) => {
  console.error("Unhandled error:", event.error);
  // Could add code to show a user-friendly error message or try to recover
};

// Define error handler for unhandled promise rejections
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Could add code to show a user-friendly error message or try to recover
};

// Add global error handlers
window.addEventListener('error', handleError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Root element finding with better error handling
let rootElement = document.getElementById("root");

if (!rootElement) {
  // Create a root element if it doesn't exist - helpful for debugging
  console.warn("Could not find root element, creating one");
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
  rootElement = newRoot;
}

console.log("Root element found, rendering app");

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("Failed to render application:", error);
  
  // Fallback rendering in case of error
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Something went wrong</h1>
      <p>The application encountered an error during initialization.</p>
      <button onclick="window.location.reload()">Reload Page</button>
      <a href="/debug.html" style="display: block; margin-top: 20px;">Go to Debug Page</a>
    </div>
  `;
}
