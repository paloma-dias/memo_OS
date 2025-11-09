import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress";

export const Clientes = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    razao_social: "",
    empresa:  "",
    numero_conta: "",
    telefone_principal: "",
    cidade: "",
    contato_primario: "",
    email_contato: "",
    status: "Ativa",
    email: "",
    telefone: "",
    endereco: "",
  });
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  const isAdmin = userRole === "admin";

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome");
    
    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setClientes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase
        .from("clientes")
        .update(formData)
        .eq("id", editingId);
      
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cliente atualizado com sucesso!" });
      }
    } else {
      const { error } = await supabase
        .from("clientes")
        .insert([formData]);
      
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cliente cadastrado com sucesso!" });
      }
    }
    
    setOpen(false);
    setEditingId(null);
    resetForm();
    fetchClientes();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      razao_social: "",
      empresa: "",
      numero_conta: "",
      telefone_principal: "",
      cidade: "",
      contato_primario: "",
      email_contato: "",
      status: "Ativa",
      email: "",
      telefone: "",
      endereco: "",
    });
  };

  const handleEdit = (cliente: any) => {
    setEditingId(cliente.id);
    setFormData({
      nome: cliente.nome || "",
      razao_social: cliente.razao_social || "",
      empresa: cliente.empresa || "",
      numero_conta: cliente.numero_conta || "",
      telefone_principal: cliente.telefone_principal || "",
      cidade: cliente.cidade || "",
      contato_primario: cliente.contato_primario || "",
      email_contato: cliente.email_contato || "",
      status: cliente.status || "Ativa",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      endereco: cliente.endereco || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cliente?")) return;
    
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cliente excluído com sucesso!" });
      fetchClientes();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(10);

    try {
      const data = await file.arrayBuffer();
      setImportProgress(30);
      
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      
      setImportProgress(50);

      if (jsonData.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "A planilha não contém dados para importar.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Mapear campos da planilha para o banco de dados
      const clientesParaInserir = jsonData.map((row) => ({
        razao_social: row['Razão Social'] || row['razao_social'] || '',
        nome: row['Razão Social'] || row['razao_social'] || row['nome'] || '',
        empresa: row['Empresa'] || row['empresa'] || '',
        numero_conta: row['Número da Conta'] || row['numero_conta'] || '',
        telefone_principal: row['Telefone Principal'] || row['telefone_principal'] || '',
        cidade: row['Cidade'] || row['cidade'] || '',
        contato_primario: row['Contato Primário'] || row['contato_primario'] || '',
        email_contato: row['Email (Contato Primário) (Contato)'] || row['email_contato'] || '',
        status: row['Status'] || row['status'] || 'Ativa',
      }));

      setImportProgress(70);

      // Inserir em lotes
      const batchSize = 50;
      let inserted = 0;
      
      for (let i = 0; i < clientesParaInserir.length; i += batchSize) {
        const batch = clientesParaInserir.slice(i, i + batchSize);
        const { error } = await supabase.from("clientes").insert(batch);
        
        if (error) {
          console.error("Erro no lote:", error);
          // Continuar com próximo lote mesmo se houver erro
        } else {
          inserted += batch.length;
        }
        
        setImportProgress(70 + (30 * i / clientesParaInserir.length));
      }

      setImportProgress(100);
      
      toast({
        title: "Importação concluída!",
        description: `${inserted} clientes importados com sucesso.`,
      });

      setImportOpen(false);
      fetchClientes();
    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error.message || "Erro desconhecido ao processar arquivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportTemplate = () => {
    const template = [
      {
        "Razão Social": "EXEMPLO LTDA",
        "Empresa": "E001",
        "Número da Conta": "C123456",
        "Telefone Principal": "16999999999",
        "Cidade": "São Paulo",
        "Contato Primário": "João Silva",
        "Email (Contato Primário) (Contato)": "contato@exemplo.com",
        "Status": "Ativa"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "template_clientes.xlsx");
    
    toast({
      title: "Template baixado!",
      description: "Use este arquivo como modelo para importação.",
    });
  };

  const filteredClientes = clientes.filter(c => 
    (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.razao_social && c.razao_social.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email_contato && c.email_contato.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de clientes</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Importar Clientes</DialogTitle>
                  <DialogDescription>
                    Faça upload de uma planilha Excel (.xlsx) com os dados dos clientes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Arquivo Excel</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={importing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato aceito: .xlsx
                    </p>
                  </div>
                  
                  {importing && (
                    <div className="space-y-2">
                      <Label>Progresso</Label>
                      <Progress value={importProgress} />
                      <p className="text-xs text-muted-foreground text-center">
                        {importProgress}% - Importando...
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleExportTemplate}
                      disabled={importing}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="razao_social">Razão Social *</Label>
                      <Input
                        id="razao_social"
                        value={formData.razao_social}
                        onChange={(e) => setFormData({ ...formData, razao_social: e.target.value, nome: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa</Label>
                      <Input
                        id="empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_conta">Número da Conta</Label>
                      <Input
                        id="numero_conta"
                        value={formData.numero_conta}
                        onChange={(e) => setFormData({ ...formData, numero_conta: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone_principal">Telefone Principal</Label>
                      <Input
                        id="telefone_principal"
                        value={formData.telefone_principal}
                        onChange={(e) => setFormData({ ...formData, telefone_principal: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_primario">Contato Primário</Label>
                      <Input
                        id="contato_primario"
                        value={formData.contato_primario}
                        onChange={(e) => setFormData({ ...formData, contato_primario: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email_contato">Email</Label>
                      <Input
                        id="email_contato"
                        type="email"
                        value={formData.email_contato}
                        onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.razao_social || cliente.nome}
                    </TableCell>
                    <TableCell>{cliente.email_contato || cliente.email}</TableCell>
                    <TableCell>{cliente.telefone_principal || cliente.telefone}</TableCell>
                    <TableCell>{cliente.cidade}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cliente.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Clientes;
