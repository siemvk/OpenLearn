"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="n;">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Oeps! | PolarLearn</title>
        <meta name="theme-color" content="#0078D7" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;600&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0078D7;
            color: #FFFFFF;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          main {
            max-width: 800px;
            width: 100%;
          }

          .emotion {
            font-size: clamp(4rem, 12vw, 8rem);
            font-weight: 300;
            margin-bottom: 2rem;
          }

          .title {
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            font-weight: 400;
            margin-bottom: 2rem;
          }

          .description {
            font-size: clamp(1rem, 2vw, 1.25rem);
            line-height: 1.6;
            margin-bottom: 2rem;
            font-weight: 300;
          }

          .error-details {
            background: rgba(255, 255, 255, 0.1);
            border-left: 4px solid #FFFFFF;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-word;
            overflow-wrap: break-word;
          }

          .error-code {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 1rem;
          }

          .actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 2rem;
          }

          .button {
            background: #FFFFFF;
            color: #0078D7;
            border: none;
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-block;
          }

          .button:hover {
            background: #E6E6E6;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .button-secondary {
            background: transparent;
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
          }

          .button-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          footer {
            margin-top: 3rem;
            font-size: 0.85rem;
            opacity: 0.8;
            line-height: 1.6;
          }

          footer a {
            color: #FFFFFF;
            text-decoration: underline;
          }

          .stack-trace {
            max-height: 200px;
            overflow-y: auto;
            font-size: 0.8rem;
            line-height: 1.4;
            white-space: pre-wrap;
          }

          .stack-trace::-webkit-scrollbar {
            width: 8px;
          }

          .stack-trace::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }

          .stack-trace::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }

          @media (max-width: 640px) {
            body {
              padding: 1rem;
            }

            .actions {
              flex-direction: column;
            }

            .button {
              width: 100%;
              text-align: center;
            }
          }
        `}</style>
      </head>
      <body>
        <main>
          <header>
            <div className="emotion">:(</div>
            <h1 className="title">Oeps! PolarLearn is gecrasht</h1>
          </header>

          <p className="description">
            Deze error zou als het goed is bij PolarNL automatisch gemeld moeten worden.
          </p>

          <p className="description">
            Volledige stacktrace:
          </p>

          {error.digest && (
            <div className="error-code">
              Error Code: {error.digest}
            </div>
          )}

          <div className="error-details">
            <strong>Error:</strong> {error.message || "An unexpected error occurred"}
            {error.stack && (
              <div className="stack-trace">
                {error.stack}
              </div>
            )}
          </div>

          <div className="actions">
            <a
              className="button"
              href="/home/start"
            >
              Naar home
            </a>
            <button
              className="button button-secondary"
              onClick={() => window.location.reload()}
            >
              Herladen
            </button>
          </div>

          <footer>
            <p>
              Als dit blijft doorgaan, meld het alsjeblieft op onze {' '}
              <a href="https://github.com/polarnl/PolarLearn/issues" target="_blank" rel="noopener noreferrer">
                GitHub repository
              </a>!
            </p>
          </footer>
        </main>
      </body>
    </html>
  );
}