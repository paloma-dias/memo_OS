import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress"; // Corrigido o import com espaço

export const Produtos = () => {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Corrigido
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
  });
  
  const { toast } = useToast();
  const { userRole } = useAuth();

  const isAdmin = userRole === "admin"; // Corrigido

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos") // Corrigido
      .select("*")      // Corrigido
      .order("nome");   // Corrigido
    
    if (error) {
      toast({
        title: "Erro ao carregar produtos", // Corrigido
        description: error.message,
        variant: "destructive", // Corrigido
      });
    } else {
      setProdutos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase
        .from("produtos") // Corrigido
        .update(formData)
        .eq("id", editingId); // Corrigido
      
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); // Corrigido
      } else {
        toast({ title: "Produto atualizado com sucesso!" }); // Corrigido
      }
    } else {
      const { error } = await supabase
        .from("produtos") // Corrigido
        .insert([formData]);
      
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }); // Corrigido
      } else {
        toast({ title: "Produto cadastrado com sucesso!" }); // Corrigido
      }
    }
    
    setOpen(false);
    setEditingId(null);
    setFormData({ codigo: "", nome: "", descricao: "" }); // Corrigido
    fetchProdutos();
  };

  const handleEdit = (produto: any) => {
    setEditingId(produto.id);
    setFormData({
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao || "", // Corrigido
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    // 
    // O uso de window.confirm() não é ideal em aplicações React modernas
    // e pode não funcionar em todos os ambientes (como iframes).
    // Considerar substituir por um modal de confirmação.
    //
    if (!confirm("Deseja realmente excluir este produto?")) return; // Corrigido
    
    const { error } = await supabase
      .from("produtos") // Corrigido
      .delete()
      .eq("id", id); // Corrigido
    
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); // Corrigido
    } else {
      toast({ title: "Produto excluído com sucesso!" }); // Corrigido
      fetchProdutos();
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
          title: "Arquivo vazio", // Corrigido
          description: "A planilha não contém dados para importar.", // Corrigido
          variant: "destructive", // Corrigido
        });
        setImporting(false);
        return;
      }

      // Mapear campos da planilha para o banco de dados
      const produtosParaInserir = jsonData
        .filter((row) => {
          // Filtrar produtos com código válido
          const codigo = row['Número do Produto (Produto) (Produto)'] || row['codigo'];
          return codigo && codigo.toString().trim() !== '';
        })
        .map((row) => {
          const codigo = row['Número do Produto (Produto) (Produto)'] || row['codigo'] || '';
          const nome = row['Produto'] || row['nome'] || '';
          const descricao = row['Descrição'] || row['descricao'] || '';

          return {
            codigo: codigo.toString().trim(),
            nome: nome.toString().trim(),
            descricao: descricao.toString().trim(),
          };
        });

      setImportProgress(70);

      if (produtosParaInserir.length === 0) {
        toast({
          title: "Nenhum produto válido", // Corrigido
          description: "Não foram encontrados produtos válidos para importar.", // Corrigido
          variant: "destructive", // Corrigido
        });
        setImporting(false);
        return;
      }

      // Inserir em lotes
      const batchSize = 50;
      let inserted = 0;
      let skipped = 0;
      
      for (let i = 0; i < produtosParaInserir.length; i += batchSize) {
        const batch = produtosParaInserir.slice(i, i + batchSize);
        
        // Tentar inserir cada item individualmente para evitar duplicados
        for (const produto of batch) {
          const { error } = await supabase
            .from("produtos") // Corrigido
            .insert([produto]);
          
          if (error) {
            // Se erro por duplicação, pular
            if (error.code === '23505') {
              skipped++;
            } else {
              console.error("Erro ao inserir produto: ", error); // Corrigido
            }
          } else {
            inserted++;
          }
        }
        
        setImportProgress(70 + (30 * i / produtosParaInserir.length));
      }

      setImportProgress(100);
      
      toast({
        title: "Importação concluída!", // Corrigido
        description: `${inserted} produtos importados. ${skipped > 0 ? `${skipped} duplicados ignorados.` : ''}`,
      });

      setImportOpen(false);
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "Erro ao importar", // Corrigido
        description: error.message || "Erro desconhecido ao processar arquivo.", // Corrigido
        variant: "destructive", // Corrigido
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
        "Número do Produto (Produto) (Produto)": "123456", // Corrigido
        "Produto": "EXEMPLO DE PRODUTO", // Corrigido
        "Descrição": "Descrição do produto exemplo" // Corrigido
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos"); // Corrigido
    XLSX.writeFile(wb, "template_produtos.xlsx"); // Corrigido
    
    toast({
      title: "Template baixado!", // Corrigido
      description: "Use este arquivo como modelo para importação.", // Corrigido
    });
  };

  const filteredProdutos = produtos.filter(p => 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Cadastro de peças e produtos</p>
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
                  <DialogTitle>Importar Produtos</DialogTitle>
                  <DialogDescription>
                    Faça upload de uma planilha Excel (.xlsx) com os dados dos produtos
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
                      Formato aceito: .xlsx (pode conter milhares de produtos)
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
                  setFormData({ codigo: "", nome: "", descricao: "" }); // Corrigido
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                    />
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
              placeholder="Buscar por código ou nome..."
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
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.codigo}</TableCell>
                    <TableCell>{produto.nome}</TableCell>
                    <TableCell className="max-w-md truncate">{produto.descricao}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(produto)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(produto.id)}
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

export default Produtos;