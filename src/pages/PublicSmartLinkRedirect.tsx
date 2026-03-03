import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function PublicSmartLinkRedirect() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current || !slug) return;
    triggered.current = true;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) {
      navigate(`/not-found?path=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    params.set("slug", slug);
    params.set("domain", window.location.hostname.toLowerCase());
    params.set("mode", "json");

    // Skip tracking if browser is marked as internal
    if (localStorage.getItem("nexus_internal_browser") === "true") {
      params.set("no_track", "1");
    }

    const edgeUrl = `https://${projectId}.supabase.co/functions/v1/redirect?${params.toString()}`;

    fetch(edgeUrl)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (data?.url) {
          window.location.replace(data.url);
          return;
        }
        throw new Error("missing url");
      })
      .catch(() => {
        navigate(`/not-found?path=${encodeURIComponent(location.pathname)}`, { replace: true });
      });
  }, [slug, location.search, location.pathname, navigate]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {!slug ? (
        <p className="text-xs text-destructive">Link inválido.</p>
      ) : (
        <>
          <span className="text-5xl animate-bounce">🚀</span>
          <div className="h-1 w-24 rounded-full overflow-hidden bg-muted">
            <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "60%" }} />
          </div>
        </>
      )}
    </main>
  );
}

