import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const ImportExport = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  if (userRole !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito a Administradores</p>
      </div>
    );
  }

  const handleImportClientes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou inválido');
      }

      // Parse CSV (esperando: id_dinamics,nome,email,telefone,endereco)
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const cliente: any = {};
        
        headers.forEach((header, index) => {
          cliente[header] = values[index] || null;
        });
        
        data.push(cliente);
      }

      // Importar clientes
      const { error: insertError } = await supabase
        .from('clientes')
        .insert(data);

      if (insertError) throw insertError;

      // Criar mapeamento De-Para
      const mappings = data.map(cliente => ({
        id_dinamics: cliente.id_dinamics,
        entidade: 'cliente',
        id_interno: cliente.id, // Será preenchido automaticamente pelo banco
      }));

      toast({
        title: "Importação concluída!",
        description: `${data.length} clientes importados com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleImportProdutos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou inválido');
      }

      // Parse CSV (esperando: codigo,nome,descricao)
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const produto: any = {};
        
        headers.forEach((header, index) => {
          produto[header] = values[index] || null;
        });
        
        data.push(produto);
      }

      // Importar produtos
      const { error: insertError } = await supabase
        .from('produtos')
        .insert(data);

      if (insertError) throw insertError;

      toast({
        title: "Importação concluída!",
        description: `${data.length} produtos importados com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExportOS = async () => {
    setExporting(true);
    try {
      // Buscar todas as OS com seus dados relacionados
      const { data: ordensServico, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          clientes (id_dinamics, nome),
          profiles (nome),
          itens_os (
            quantidade,
            produtos (codigo, nome)
          )
        `);

      if (error) throw error;

      // Gerar CSV para comunicação reversa com ERP
      const csvLines = [
        'id_dinamics_os,numero,cliente_dinamics,tecnico,status,laudo,data_inicio,data_fim,produtos',
      ];

      ordensServico?.forEach((os: any) => {
        const produtos = os.itens_os
          ?.map((item: any) => `${item.produtos.codigo}:${item.quantidade}`)
          .join(';') || '';

        csvLines.push(
          `${os.id_dinamics_os || ''},${os.numero},${os.clientes?.id_dinamics || ''},${os.profiles?.nome || ''},${os.status_atual},"${os.laudo || ''}",${os.data_inicio_execucao || ''},${os.data_fim_execucao || ''},"${produtos}"`
        );
      });

      // Download do arquivo
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `export_os_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Exportação concluída!",
        description: `${ordensServico?.length} OS exportadas.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importação/Exportação</h1>
        <p className="text-muted-foreground">Gerencie a comunicação com o ERP Dynamics</p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Importar Clientes
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Formato esperado: id_dinamics,nome,email,telefone,endereco
                </p>
                <Label htmlFor="import-clientes" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Clique para selecionar arquivo CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
                  </div>
                </Label>
                <Input
                  id="import-clientes"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportClientes}
                  disabled={importing}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Importar Produtos
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Formato esperado: codigo,nome,descricao
                </p>
                <Label htmlFor="import-produtos" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Clique para selecionar arquivo CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
                  </div>
                </Label>
                <Input
                  id="import-produtos"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportProdutos}
                  disabled={importing}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Exportar Ordens de Serviço</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gera arquivo CSV com todas as OS para comunicação reversa com o ERP Dynamics.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">O arquivo incluirá:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• ID Dynamics da OS</li>
                  <li>• Número da OS</li>
                  <li>• Cliente (ID Dynamics)</li>
                  <li>• Técnico responsável</li>
                  <li>• Status atual</li>
                  <li>• Laudo/Diagnóstico</li>
                  <li>• Datas de execução</li>
                  <li>• Lista de produtos e quantidades</li>
                </ul>
              </div>

              <Button
                onClick={handleExportOS}
                disabled={exporting}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Exportando..." : "Exportar OS para CSV"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
