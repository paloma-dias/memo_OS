import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const Tecnicos = () => {
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchTecnicos();
  }, []);

  const fetchTecnicos = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        nome,
        email,
        telefone,
        user_roles (
          role
        )
      `)
      .order("nome");
    
    if (error) {
      toast({
        title: "Erro ao carregar técnicos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTecnicos(data || []);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Técnicos</h1>
        <p className="text-muted-foreground">Lista de usuários cadastrados no sistema</p>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tecnicos.map((tecnico) => (
              <TableRow key={tecnico.id}>
                <TableCell className="font-medium">{tecnico.nome}</TableCell>
                <TableCell>{tecnico.email}</TableCell>
                <TableCell>{tecnico.telefone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={tecnico.user_roles?.[0]?.role === "admin" ? "default" : "secondary"}>
                    {tecnico.user_roles?.[0]?.role === "admin" ? "Administrador" : "Operador"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};