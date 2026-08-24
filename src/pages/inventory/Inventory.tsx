import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { InventoryHeader } from "./components/stock/InventoryHeader";
import { useMinStockLevels } from "./hooks/useMinStockLevels";
import { StockAlert } from "./components/StockAlert";
import { StockRequestsList } from "./components/StockRequestsList";
import { StockRequest } from "./components/StockRequest";
import { CylinderControl } from "./components/CylinderControl";
import { useAuth } from "@/contexts/auth";
import { InventoryApp } from "./components/inventory";
import { UserRole } from "@/types/userTypes";
import { EstoqueGeralPanel } from "./components/estoque/EstoqueGeralPanel";
import { useEstoqueGeral } from "./hooks/useEstoqueGeral";

const Inventory = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [, setRefreshCounter] = useState(0);

  // Get user role from auth context
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  const { minStock, fetchMinStockLevels } = useMinStockLevels();
  const { linhas, isLoading } = useEstoqueGeral();

  useEffect(() => {
    fetchMinStockLevels();
  }, [fetchMinStockLevels]);

  // Totais reais (pátio + portaria) para os alertas de estoque mínimo
  const currentStock = useMemo(
    () => ({
      p13: linhas.find((l) => l.produto === "P13")?.total_cheios ?? 0,
      p20: linhas.find((l) => l.produto === "P20")?.total_cheios ?? 0,
      p45: linhas.find((l) => l.produto === "P45")?.total_cheios ?? 0,
      water: linhas.find((l) => l.produto === "agua")?.total_cheios ?? 0,
    }),
    [linhas]
  );

  // Toast notification when stock drops below minimum
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (isLoading || notifiedRef.current) return;
    const low: string[] = [];
    if (currentStock.p13 < minStock.p13) low.push("GLP P13");
    if (currentStock.p20 < minStock.p20) low.push("GLP P20");
    if (currentStock.p45 < minStock.p45) low.push("GLP P45");
    if (currentStock.water < minStock.water) low.push("Água 20L");
    if (low.length > 0) {
      toast.warning("Estoque baixo", {
        description: `Produtos abaixo do mínimo: ${low.join(", ")}`,
      });
      notifiedRef.current = true;
    }
  }, [isLoading, currentStock, minStock]);

  const handleRequestCreated = () => {
    setShowRequestForm(false);
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-6">
      {showRequestForm ? (
        <StockRequest
          onRequestCreated={handleRequestCreated}
          onCancel={() => setShowRequestForm(false)}
        />
      ) : (
        <>
          <InventoryHeader
            userRole={userRole}
            onNewRequestClick={() => setShowRequestForm(true)}
          />

          <div className="mt-6">
            {!isLoading && <StockAlert currentStock={currentStock} minStock={minStock} />}

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="requests">Requisições</TabsTrigger>
                <TabsTrigger value="cylinders">Controle de Cascos</TabsTrigger>
                <TabsTrigger value="advanced">Gerenciamento Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card className="p-4">
                  <EstoqueGeralPanel minStock={minStock} />
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="mt-4">
                <StockRequestsList />
              </TabsContent>

              <TabsContent value="cylinders" className="mt-4">
                <CylinderControl />
              </TabsContent>

              <TabsContent value="advanced" className="mt-4">
                <InventoryApp />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
