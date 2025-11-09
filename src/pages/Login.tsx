import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface LoginProps {
  onLogin: (userType: "admin" | "operador", userName: string) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulação de login - substituir por API real
    setTimeout(() => {
      if (email && password) {
        const userType = email.includes("admin") ? "admin" : "operador";
        const userName = email.split("@")[0];
        onLogin(userType, userName);
        toast.success("Login realizado com sucesso!");
      } else {
        toast.error("Preencha todos os campos");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-3xl">M</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">MEMO</h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestão de OS</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Credenciais de teste:
            </p>
            <div className="space-y-1 text-xs">
              <p><strong>Admin:</strong> admin@memo.com</p>
              <p><strong>Operador:</strong> operador@memo.com</p>
              <p className="text-muted-foreground">Senha: qualquer</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
