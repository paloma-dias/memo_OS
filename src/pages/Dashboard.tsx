import { useState, useEffect } from "react";
import { ClipboardList, Users, AlertCircle, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const { userRole, user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    emAndamento: 0,
    atrasadas: 0,
    tecnicos: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentOrders();
    }
  }, [user, userRole]);

  const fetchStats = async () => {
    if (!user) return;

    let queryTotal = supabase.from("ordens_servico").select("*", { count: "exact", head: true });
    let queryAndamento = supabase
      .from("ordens_servico")
      .select("*", { count: "exact", head: true })
      .in("status_atual", ["em_diagnostico", "em_execucao"]);

    if (userRole === "operador") {
      queryTotal = queryTotal.eq("id_tecnico_principal", user.id);
      queryAndamento = queryAndamento.eq("id_tecnico_principal", user.id);
    }

    const [totalResult, andamentoResult] = await Promise.all([
      queryTotal,
      queryAndamento,
    ]);

    const today = new Date().toISOString().split("T")[0];
    let queryAtrasadas = supabase
      .from("ordens_servico")
      .select("*", { count: "exact", head: true })
      .lt("prazo", today)
      .neq("status_atual", "finalizada");

    if (userRole === "operador") {
      queryAtrasadas = queryAtrasadas.eq("id_tecnico_principal", user.id);
    }

    const atrasadasResult = await queryAtrasadas;

    let tecnicosCount = 0;
    if (userRole === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      tecnicosCount = count || 0;
    }

    setStats({
      total: totalResult.count || 0,
      emAndamento: andamentoResult.count || 0,
      atrasadas: atrasadasResult.count || 0,
      tecnicos: tecnicosCount,
    });
  };

  const fetchRecentOrders = async () => {
    if (!user) return;

    let query = supabase
      .from("ordens_servico")
      .select(`
        *,
        clientes (nome)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    if (userRole === "operador") {
      query = query.eq("id_tecnico_principal", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro ao carregar ordens",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecentOrders(data || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta":
      case "aguardando_aprovacao":
        return "bg-status-pending";
      case "designada":
      case "em_diagnostico":
      case "em_execucao":
        return "bg-status-progress";
      case "finalizada":
        return "bg-status-completed";
      case "aguardando_pecas":
        return "bg-status-delayed";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberta: "Aberta",
      designada: "Designada",
      em_diagnostico: "Em Diagnóstico",
      aguardando_aprovacao: "Aguardando Aprovação",
      aguardando_pecas: "Aguardando Peças",
      em_execucao: "Em Execução",
      finalizada: "Finalizada",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral {userRole === "admin" ? "de todas as OS" : "das suas OS"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de OS"
          value={stats.total}
          icon={ClipboardList}
          description="Ordens de serviço"
        />
        
        {userRole === "admin" && (
          <StatCard
            title="Técnicos Ativos"
            value={stats.tecnicos}
            icon={Users}
            description="Operadores cadastrados"
          />
        )}
        
        <StatCard
          title="Em Andamento"
          value={stats.emAndamento}
          icon={CheckCircle}
          description="OS sendo executadas"
        />
        
        <StatCard
          title="Atrasadas"
          value={stats.atrasadas}
          icon={AlertCircle}
          description="Necessitam atenção"
        />
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Ordens Recentes</h2>
            <Badge variant="secondary">{recentOrders.length}</Badge>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma OS cadastrada
              </p>
            ) : (
              recentOrders.map((order) => {
                const isAtrasado = order.prazo && new Date(order.prazo) < new Date() && order.status_atual !== "finalizada";
                
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">OS #{order.numero}</span>
                        <span className="text-sm text-muted-foreground">{order.clientes?.nome}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {order.prazo && (
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-sm text-muted-foreground">Prazo</span>
                          <span className={`text-sm font-medium ${isAtrasado ? "text-status-delayed" : "text-foreground"}`}>
                            {new Date(order.prazo).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}
                      
                      <Badge className={getStatusColor(order.status_atual)}>
                        {getStatusLabel(order.status_atual)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
