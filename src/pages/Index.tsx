import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import Kanban from "./Kanban";
import { Agenda } from "./Agenda";
import { Clientes } from "./Clientes";
import { Tecnicos } from "./Tecnicos";
import { Produtos } from "./Produtos";
import { NovaOS } from "./NovaOS";
import { Aprovacao } from "./Aprovacao";
import { Mapeamento } from "./Mapeamento";
import { ImportExport } from "./ImportExport";
import { Usuarios } from "./Usuarios";
import { DetalhesOS } from "./DetalhesOS";
import { Ocorrencias } from "./Ocorrencias";

const Index = () => {
  const navigate = useNavigate();
  const { user, userName, userRole, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "ocorrencias":
        return <Ocorrencias />;
      case "kanban":
        return <Kanban />;
      case "agenda":
        return <Agenda />;
      case "detalhes-os":
        return <DetalhesOS />;
      case "aprovacao":
        return <Aprovacao />;
      case "clientes":
        return <Clientes />;
      case "tecnicos":
        return <Tecnicos />;
      case "usuarios":
        return <Usuarios />;
      case "produtos":
        return <Produtos />;
      case "nova-os":
        return <NovaOS />;
      case "mapeamento":
        return <Mapeamento />;
      case "import-export":
        return <ImportExport />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        userType={userRole || "operador"}
        userName={userName}
        onLogout={signOut}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 md:ml-64 p-6">
          <div className="container mx-auto max-w-7xl">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
