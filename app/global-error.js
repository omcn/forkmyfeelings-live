"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "linear-gradient(to bottom, #ffe4e6, #fed7aa)",
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>😵</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "24px", maxWidth: "24rem" }}>
            Rascal hit a bump. Try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#ec4899",
              color: "white",
              fontWeight: "600",
              padding: "12px 32px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
