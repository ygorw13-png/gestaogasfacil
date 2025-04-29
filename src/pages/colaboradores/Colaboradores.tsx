
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ColaboradoresList from "./components/ColaboradoresList";
import NovoColaborador from "./components/NovoColaborador";
import { Separator } from "@/components/ui/separator";

export default function Colaboradores() {
  const [activeTab, setActiveTab] = useState("lista");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Função para forçar atualização da lista
  const refreshList = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 100);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Colaboradores</h1>
      </div>
      
      <Separator className="my-4" />
      
      <Tabs 
        defaultValue="lista" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lista">Lista de Colaboradores</TabsTrigger>
          <TabsTrigger value="novo">Novo Colaborador</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="mt-6">
          <ColaboradoresList key={isRefreshing ? "refresh" : "static"} />
        </TabsContent>
        
        <TabsContent value="novo" className="mt-6">
          <NovoColaborador 
            onSuccess={() => {
              setActiveTab("lista");
              refreshList();
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
