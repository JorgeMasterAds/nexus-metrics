import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, theme = "dark" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  const renderedRef = useRef(false);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    let scriptLoadTimeout: ReturnType<typeof setTimeout>;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || renderedRef.current) return;
      renderedRef.current = true;

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": (errorCode: string) => {
          console.warn("[Turnstile] error:", errorCode);
          onErrorRef.current?.();
        },
        "timeout-callback": () => {
          console.warn("[Turnstile] timeout");
          onErrorRef.current?.();
        },
        theme,
        size: "flexible",
      });
    };

    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      script.onerror = () => onErrorRef.current?.();
      window.onTurnstileLoad = renderWidget;
      document.head.appendChild(script);
      // Timeout: if script doesn't load in 8s, fire error
      scriptLoadTimeout = setTimeout(() => {
        if (!window.turnstile) onErrorRef.current?.();
      }, 8000);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      window.onTurnstileLoad = renderWidget;
      scriptLoadTimeout = setTimeout(() => {
        if (!window.turnstile) onErrorRef.current?.();
      }, 8000);
    }

    return () => {
      clearTimeout(scriptLoadTimeout);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      renderedRef.current = false;
    };
  }, [siteKey, theme]);

  return <div ref={containerRef} className="w-full" />;
}
