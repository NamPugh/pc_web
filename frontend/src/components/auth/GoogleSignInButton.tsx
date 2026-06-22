import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "filled_black";
          size: "large";
          shape: "rectangular";
          text: "continue_with";
          width: number;
          locale: string;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleScriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Không thể tải Google Identity")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google Identity"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
};

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [loadError, setLoadError] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
    credentialHandler = (credential) => callbackRef.current(credential);
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;

        const container = containerRef.current;
        container.replaceChildren();
        if (!initializedClientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: ({ credential }) => {
              if (credential) credentialHandler?.(credential);
            },
          });
          initializedClientId = clientId;
        }
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          width: Math.max(240, Math.min(container.clientWidth, 400)),
          locale: "vi",
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-center text-xs text-white/35">
        Đăng nhập Google chưa được cấu hình
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-11 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-center text-xs text-red-300/80">
        Không thể tải đăng nhập Google
      </div>
    );
  }

  return <div className="min-h-11 w-full overflow-hidden rounded-lg" ref={containerRef} />;
}
