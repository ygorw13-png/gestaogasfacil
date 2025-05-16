
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockMaintenances } from '../data';
import { mockVehicleExpenses } from '../data';
import { mockFuelEntries } from '../data/mockFuelEntries';
import { mockVehicles } from '../data/mockVehicles';
import { mockAssignments } from '../data/mockAssignments';
import { 
  Vehicle, 
  MaintenanceItem, 
  VehicleExpense, 
  FuelEntry,
  VehicleAssignment
} from '../types';
import { useToast } from '@/hooks/use-toast';

interface FleetContextType {
  // Vehicles
  vehicles: Vehicle[];

  // Maintenance
  maintenances: MaintenanceItem[];
  addMaintenance: (maintenance: Omit<MaintenanceItem, 'id'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceItem['status']) => void;
  
  // Expenses
  expenses: VehicleExpense[];
  addExpense: (expense: Omit<VehicleExpense, 'id'>) => void;
  
  // Fuel
  fuelEntries: FuelEntry[];
  addFuelEntry: (entry: Omit<FuelEntry, 'id'>) => void;
  
  // Assignments
  assignments: VehicleAssignment[];
  addAssignment: (assignment: Omit<VehicleAssignment, 'id'>) => void;
  endAssignment: (id: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>(mockMaintenances);
  const [expenses, setExpenses] = useState<VehicleExpense[]>(mockVehicleExpenses);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(mockFuelEntries);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>(mockAssignments);
  
  const { toast } = useToast();

  // In a real app, we would fetch data from API here
  useEffect(() => {
    // Fetch data from API
    console.log("Fleet context initialized");
  }, []);

  // Maintenance methods
  const addMaintenance = (maintenance: Omit<MaintenanceItem, 'id'>) => {
    const newMaintenance = { 
      ...maintenance, 
      id: `maint-${Date.now()}`
    };
    
    setMaintenances(prev => [newMaintenance, ...prev]);
    
    toast({
      title: "Manutenção agendada",
      description: `Manutenção para ${newMaintenance.vehiclePlate} agendada com sucesso.`
    });
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceItem['status']) => {
    setMaintenances(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status, completionDate: status === 'completed' ? new Date().toISOString() : item.completionDate }
          : item
      )
    );
    
    toast({
      title: "Status atualizado",
      description: `Status da manutenção atualizado para ${status}.`
    });
  };

  // Expense methods
  const addExpense = (expense: Omit<VehicleExpense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: `exp-${Date.now()}`
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    
    toast({
      title: "Despesa registrada",
      description: `Despesa de R$${newExpense.amount.toFixed(2)} registrada com sucesso.`
    });
  };

  // Fuel entry methods
  const addFuelEntry = (entry: Omit<FuelEntry, 'id'>) => {
    const newEntry = {
      ...entry,
      id: `fuel-${Date.now()}`
    };
    
    setFuelEntries(prev => [newEntry, ...prev]);
    
    toast({
      title: "Abastecimento registrado",
      description: `Abastecimento de ${newEntry.liters}L registrado com sucesso.`
    });
  };

  // Assignment methods
  const addAssignment = (assignment: Omit<VehicleAssignment, 'id'>) => {
    const newAssignment = {
      ...assignment,
      id: `assign-${Date.now()}`
    };
    
    setAssignments(prev => [newAssignment, ...prev]);
    
    toast({
      title: "Atribuição registrada",
      description: `Veículo ${newAssignment.vehiclePlate} atribuído a ${newAssignment.employeeName}.`
    });
  };

  const endAssignment = (id: string) => {
    setAssignments(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, endDate: new Date().toISOString(), isActive: false }
          : item
      )
    );
    
    toast({
      title: "Atribuição encerrada",
      description: "Atribuição de veículo encerrada com sucesso."
    });
  };

  const value = {
    vehicles,
    maintenances,
    expenses,
    fuelEntries,
    assignments,
    addMaintenance,
    updateMaintenanceStatus,
    addExpense,
    addFuelEntry,
    addAssignment,
    endAssignment
  };

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = (): FleetContextType => {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
