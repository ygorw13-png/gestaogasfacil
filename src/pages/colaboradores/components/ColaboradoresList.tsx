
import { useState, useEffect } from "react";
import { customTables } from "@/integrations/supabase/customClient";
import { Colaborador } from "@/types/supabaseTypes";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import EditarColaborador from "./EditarColaborador";
import { Search, Edit, User, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColaboradoresList() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("ColaboradoresList - Montado, carregando dados");
    loadColaboradores();
  }, []);

  const loadColaboradores = async () => {
    console.log("ColaboradoresList - Iniciando carregamento de dados");
    setLoading(true);
    try {
      const { data, error } = await customTables.colaboradores.select();
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log("ColaboradoresList - Dados carregados com sucesso:", data.length);
        setColaboradores(data as Colaborador[]);
      }
    } catch (error: any) {
      console.error("ColaboradoresList - Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar colaboradores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    loadColaboradores();
  };

  const filteredColaboradores = colaboradores.filter(
    (colaborador) =>
      colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colaborador.cpf && colaborador.cpf.includes(searchTerm))
  );

  const renderSituacaoBadge = (situacao: string) => {
    if (situacao === 'ativo') {
      return <Badge className="bg-green-500">Ativo</Badge>;
    } else {
      return <Badge variant="outline" className="text-gray-500">Inativo</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome, cargo ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={loadColaboradores} variant="outline" className="w-full md:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Data de Admissão</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      {searchTerm 
                        ? "Nenhum colaborador encontrado com os critérios da pesquisa." 
                        : "Ainda não há colaboradores cadastrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredColaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {colaborador.nome}
                        </div>
                      </TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>
                        {format(new Date(colaborador.data_admissao), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{colaborador.telefone || "-"}</TableCell>
                      <TableCell>{renderSituacaoBadge(colaborador.situacao)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditClick(colaborador)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          {editingColaborador && (
            <EditarColaborador 
              colaborador={editingColaborador}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
