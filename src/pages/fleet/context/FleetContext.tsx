import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Vehicle, MaintenanceItem, VehicleExpense, FuelEntry, VehicleAssignment } from "../types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FleetContextType {
  vehicles: Vehicle[];
  loading: boolean;
  refreshVehicles: () => Promise<void>;
  addVehicle: (v: Omit<Vehicle, "id">) => Promise<void>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  maintenances: MaintenanceItem[];
  addMaintenance: (m: Omit<MaintenanceItem, "id">) => Promise<void>;
  updateMaintenanceStatus: (id: string, status: MaintenanceItem["status"]) => Promise<void>;

  expenses: VehicleExpense[];
  addExpense: (e: Omit<VehicleExpense, "id">) => Promise<void>;

  fuelEntries: FuelEntry[];
  addFuelEntry: (e: Omit<FuelEntry, "id">) => Promise<void>;

  assignments: VehicleAssignment[];
  addAssignment: (a: Omit<VehicleAssignment, "id">) => Promise<void>;
  endAssignment: (id: string) => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const mapVehicle = (r: any): Vehicle => ({
  id: r.id,
  plate: r.plate,
  model: r.model || "",
  year: r.year || new Date().getFullYear(),
  type: (r.type as Vehicle["type"]) || "car",
  status: (r.status as Vehicle["status"]) || "active",
  mileage: r.current_km || 0,
  notes: r.notes || undefined,
});

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [v, m, e, f, a, d] = await Promise.all([
      supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicle_maintenances").select("*").order("date", { ascending: false }),
      supabase.from("vehicle_expenses").select("*").order("date", { ascending: false }),
      supabase.from("vehicle_fuels").select("*").order("date", { ascending: false }),
      supabase.from("vehicle_assignments").select("*").order("start_date", { ascending: false }),
      supabase.from("despesas" as any).select("*").order("data", { ascending: false }),
    ]);
    const vMap = new Map<string, string>();
    (v.data || []).forEach((r: any) => vMap.set(r.id, r.plate));
    setVehicles((v.data || []).map(mapVehicle));

    // Despesas lançadas em outros módulos (ex: portaria) também entram na frota
    const despesas = (d.data || []) as any[];
    const despesaPlaca = (r: any) => r.veiculo_placa || vMap.get(r.veiculo_id) || "—";
    const despesasFrota: VehicleExpense[] = despesas.map((r: any) => ({
      id: `despesa-${r.id}`,
      vehiclePlate: despesaPlaca(r),
      date: r.data,
      description: r.descricao || "",
      type: r.tipo === "combustivel" ? "fuel" : r.tipo === "manutencao" ? "maintenance" : "other",
      amount: Number(r.valor) || 0,
      notes: r.observacoes || undefined,
    }));
    const despesasCombustivel: FuelEntry[] = despesas
      .filter((r: any) => r.tipo === "combustivel")
      .map((r: any) => ({
        id: `despesa-${r.id}`,
        vehiclePlate: despesaPlaca(r),
        date: r.data,
        mileage: 0,
        fuelType: r.categoria || "combustível",
        liters: 0,
        cost: Number(r.valor) || 0,
        notes: r.descricao || undefined,
      }));
    setMaintenances(
      (m.data || []).map((r: any) => ({
        id: r.id,
        vehiclePlate: vMap.get(r.vehicle_id) || "",
        type: r.type,
        scheduledDate: r.date,
        completionDate: r.status === "completed" ? r.date : null,
        priority: "medium",
        status: r.status as MaintenanceItem["status"],
        estimatedCost: Number(r.cost) || 0,
        actualCost: Number(r.cost) || 0,
        mileage: r.km || undefined,
        notes: r.description || undefined,
      }))
    );
    setExpenses(
      (e.data || []).map((r: any) => ({
        id: r.id,
        vehiclePlate: vMap.get(r.vehicle_id) || "",
        date: r.date,
        description: r.description || "",
        type: (r.type as VehicleExpense["type"]) || "other",
        amount: Number(r.amount) || 0,
        notes: r.notes || undefined,
      }))
    );
    setFuelEntries(
      (f.data || []).map((r: any) => ({
        id: r.id,
        vehiclePlate: vMap.get(r.vehicle_id) || "",
        date: r.date,
        mileage: r.km || 0,
        fuelType: r.fuel_type || "gasolina",
        liters: Number(r.liters) || 0,
        cost: Number(r.total) || 0,
        notes: r.notes || undefined,
      }))
    );
    setAssignments(
      (a.data || []).map((r: any) => ({
        id: r.id,
        vehiclePlate: vMap.get(r.vehicle_id) || "",
        employeeName: r.driver_name,
        startDate: r.start_date,
        endDate: r.end_date || null,
        isActive: r.status === "ativo" && !r.end_date,
        notes: r.notes || undefined,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const findVehicleId = (plate: string) => vehicles.find((v) => v.plate === plate)?.id;

  const addVehicle = useCallback(async (v: Omit<Vehicle, "id">) => {
    const { error } = await supabase.from("vehicles").insert({
      plate: v.plate, model: v.model, year: v.year, type: v.type,
      status: v.status, current_km: v.mileage, notes: v.notes,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Veículo adicionado" });
    fetchAll();
  }, [toast, fetchAll]);

  const updateVehicle = useCallback(async (id: string, v: Partial<Vehicle>) => {
    const payload: any = {};
    if (v.plate !== undefined) payload.plate = v.plate;
    if (v.model !== undefined) payload.model = v.model;
    if (v.year !== undefined) payload.year = v.year;
    if (v.type !== undefined) payload.type = v.type;
    if (v.status !== undefined) payload.status = v.status;
    if (v.mileage !== undefined) payload.current_km = v.mileage;
    if (v.notes !== undefined) payload.notes = v.notes;
    const { error } = await supabase.from("vehicles").update(payload).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Veículo atualizado" });
    fetchAll();
  }, [toast, fetchAll]);

  const deleteVehicle = useCallback(async (id: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Veículo removido" });
    fetchAll();
  }, [toast, fetchAll]);

  const addMaintenance = useCallback(async (m: Omit<MaintenanceItem, "id">) => {
    const vid = findVehicleId(m.vehiclePlate);
    if (!vid) { toast({ title: "Veículo não encontrado", variant: "destructive" }); return; }
    const { error } = await supabase.from("vehicle_maintenances").insert({
      vehicle_id: vid, type: m.type, description: m.notes, date: m.scheduledDate,
      cost: m.estimatedCost, km: m.mileage, status: m.status,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Manutenção agendada" });
    fetchAll();
  }, [toast, fetchAll, vehicles]);

  const updateMaintenanceStatus = useCallback(async (id: string, status: MaintenanceItem["status"]) => {
    const { error } = await supabase.from("vehicle_maintenances").update({ status }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Status atualizado" });
    fetchAll();
  }, [toast, fetchAll]);

  const addExpense = useCallback(async (e: Omit<VehicleExpense, "id">) => {
    const vid = findVehicleId(e.vehiclePlate);
    if (!vid) { toast({ title: "Veículo não encontrado", variant: "destructive" }); return; }
    const { error } = await supabase.from("vehicle_expenses").insert({
      vehicle_id: vid, type: e.type, description: e.description,
      date: e.date, amount: e.amount, notes: e.notes,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Despesa registrada" });
    fetchAll();
  }, [toast, fetchAll, vehicles]);

  const addFuelEntry = useCallback(async (e: Omit<FuelEntry, "id">) => {
    const vid = findVehicleId(e.vehiclePlate);
    if (!vid) { toast({ title: "Veículo não encontrado", variant: "destructive" }); return; }
    const { error } = await supabase.from("vehicle_fuels").insert({
      vehicle_id: vid, date: e.date, liters: e.liters, total: e.cost,
      km: e.mileage, fuel_type: e.fuelType, notes: e.notes,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Abastecimento registrado" });
    fetchAll();
  }, [toast, fetchAll, vehicles]);

  const addAssignment = useCallback(async (a: Omit<VehicleAssignment, "id">) => {
    const vid = findVehicleId(a.vehiclePlate);
    if (!vid) { toast({ title: "Veículo não encontrado", variant: "destructive" }); return; }
    const { error } = await supabase.from("vehicle_assignments").insert({
      vehicle_id: vid, driver_name: a.employeeName,
      start_date: a.startDate, end_date: a.endDate || null,
      status: a.isActive ? "ativo" : "encerrado", notes: a.notes,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Atribuição registrada" });
    fetchAll();
  }, [toast, fetchAll, vehicles]);

  const endAssignment = useCallback(async (id: string) => {
    const { error } = await supabase.from("vehicle_assignments")
      .update({ end_date: new Date().toISOString().split("T")[0], status: "encerrado" })
      .eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Atribuição encerrada" });
    fetchAll();
  }, [toast, fetchAll]);

  return (
    <FleetContext.Provider value={{
      vehicles, loading, refreshVehicles: fetchAll,
      addVehicle, updateVehicle, deleteVehicle,
      maintenances, addMaintenance, updateMaintenanceStatus,
      expenses, addExpense,
      fuelEntries, addFuelEntry,
      assignments, addAssignment, endAssignment,
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = (): FleetContextType => {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within a FleetProvider");
  return ctx;
};
