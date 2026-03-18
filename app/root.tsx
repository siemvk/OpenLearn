import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { initI18n } from "./i18n";

import { TRPCReactProvider } from "~/utils/trpc/react";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
];

export async function loader() {
  return {
    lang: process.env.APP_LANG || "nl",
    colorScheme: "dark" // Placeholder, later zal dit bepaald worden op basis van gebruikersinstellingen :)
    // de placeholder zal niet mijn ogen branden dus ik vernander dit -siem
  };
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Openlearn" },
    { name: "description", content: "Openlearn is een opensource alternative voor WRTS." },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as { lang: string, colorScheme: "light" | "dark" } | undefined;
  const lang = data?.lang || "nl";

  initI18n(lang);

  return (
    <html lang={lang} className="h-full w-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full w-full">
        <header className="w-full px-6 py-4">
        </header>

        <main className="w-full pt-24">
          {children}
        </main>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <TRPCReactProvider>
      <Outlet />
    </TRPCReactProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "Pagina niet gevonden."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="h-full w-full flex flex-col itwems-center justify-center text-center">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
