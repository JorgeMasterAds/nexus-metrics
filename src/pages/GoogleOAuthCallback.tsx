import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      navigate("/integrations?tab=google&google=error", { replace: true });
      return;
    }

    if (!code) {
      navigate("/integrations?tab=google&google=error", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("google-oauth-callback", {
          body: {
            code,
            redirect_uri: window.location.origin + "/auth/google/callback",
          },
        });
        if (fnError || !data?.success) {
          navigate("/integrations?tab=google&google=error", { replace: true });
        } else {
          navigate("/integrations?tab=google&google=success", { replace: true });
        }
      } catch {
        navigate("/integrations?tab=google&google=error", { replace: true });
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Conectando ao Google...</p>
      </div>
    </div>
  );
}
