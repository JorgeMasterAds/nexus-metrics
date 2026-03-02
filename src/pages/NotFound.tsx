import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl font-black text-primary tracking-tighter">404</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            O endereço <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono text-destructive">{location.pathname}</code> não existe ou foi removido.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="default" asChild>
            <Link to="/home"><Home className="mr-2 h-4 w-4" /> Ir para o Início</Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
