import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";

export default function PublicSmartLinkRedirect() {
  const { slug } = useParams();
  const location = useLocation();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current || !slug) return;
    triggered.current = true;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;

    const params = new URLSearchParams(location.search);
    params.set("slug", slug);
    params.set("domain", window.location.hostname.toLowerCase());
    params.set("mode", "json");

    const edgeUrl = `https://${projectId}.supabase.co/functions/v1/redirect?${params.toString()}`;

    // Fetch destination URL directly, then redirect — eliminates one hop
    fetch(edgeUrl)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (data?.url) {
          window.location.replace(data.url);
        }
      })
      .catch(() => {
        // Fallback: redirect via edge function 302
        const fallbackParams = new URLSearchParams(location.search);
        fallbackParams.set("slug", slug);
        fallbackParams.set("domain", window.location.hostname.toLowerCase());
        window.location.replace(
          `https://${projectId}.supabase.co/functions/v1/redirect?${fallbackParams.toString()}`
        );
      });
  }, [slug, location.search]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {!slug ? (
        <p className="text-xs text-destructive">Link inválido.</p>
      ) : (
        <>
          <span className="text-5xl animate-bounce">🚀</span>
          <div className="h-1 w-24 rounded-full overflow-hidden bg-muted">
            <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
          </div>
        </>
      )}
    </main>
  );
}
