"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: "12px",
            fontSize: "13px",
            padding: "10px 14px",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#1e293b" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#1e293b" } },
        }}
      />
    </SessionProvider>
  );
}
