import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toasts } from "@/components/toasts";
import { registerServiceWorker } from "@/lib/pwa-register";
import appCss from "../styles.css?url";

const APP_NAME = "Oasis Clock-In";

// Register PWA service worker
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1E3A5F" },
      { name: "description", content: "Device-locked SIWES attendance for Sandlip Oasis interns." },
      // iOS specific PWA meta tags
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ClockIn" },
      // Microsoft specific
      { name: "msapplication-TileColor", content: "#1E3A5F" },
      { name: "msapplication-tap-highlight", content: "no" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Toasts />
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
