import { LayoutDashboard, ClipboardList, Calendar, Settings, X, Users, Upload, Link2, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ currentPage, onNavigate, isOpen = true, onClose }: SidebarProps) => {
  const { userRole } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertCircle },
    { id: "kanban", label: "Kanban - OS", icon: ClipboardList },
    { id: "detalhes-os", label: "Diagnóstico e Cotação", icon: FileText },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "aprovacao", label: "Aprovação OS", icon: CheckCircle, adminOnly: true },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "tecnicos", label: "Técnicos", icon: Users, adminOnly: true },
    { id: "usuarios", label: "Usuários", icon: Users, adminOnly: true },
    { id: "produtos", label: "Produtos", icon: Settings },
    { id: "mapeamento", label: "Mapeamento De-Para", icon: Link2, adminOnly: true },
    { id: "import-export", label: "Importar/Exportar", icon: Upload, adminOnly: true },
  ].filter(item => !item.adminOnly || userRole === "admin");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="font-semibold text-foreground">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
