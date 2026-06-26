"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "../../lib/store";

const Toaster = ({ ...props }: ToasterProps) => {
  // Use the app's own ThemeProvider (there is no next-themes provider mounted),
  // so toasts actually match the active light/dark theme.
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
