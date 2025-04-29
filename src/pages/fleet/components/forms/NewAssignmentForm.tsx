
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { mockVehicles, mockAssignments } from "../../data";
import { ColaboradorSelect } from "@/components/inputs/ColaboradorSelect";
import { customTables } from "@/integrations/supabase/customClient";
import { Colaborador } from "@/types/supabaseTypes";

const assignmentSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  employeeId: z.string().min(1, "Funcionário é obrigatório"),
  startDate: z.date({
    required_error: "Data inicial é obrigatória",
  }),
  endDate: z.date({
    required_error: "Data final é obrigatória",
  }).nullable(),
});

interface NewAssignmentFormProps {
  onSuccess: () => void;
  assignment?: any;
  isEditing?: boolean;
}

export default function NewAssignmentForm({ onSuccess, assignment, isEditing = false }: NewAssignmentFormProps) {
  const [availableVehicles, setAvailableVehicles] = useState(mockVehicles.filter(v => v.status === 'active'));
  
  useEffect(() => {
    if (isEditing && assignment) {
      const assignedVehicle = mockVehicles.find(v => v.id === assignment.vehicleId);
      if (assignedVehicle && !availableVehicles.find(v => v.id === assignedVehicle.id)) {
        setAvailableVehicles([...availableVehicles, assignedVehicle]);
      }
    }
  }, [isEditing, assignment]);

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      vehicleId: assignment?.vehicleId || "",
      employeeId: assignment?.employeeId || "",
      startDate: assignment?.startDate ? new Date(assignment.startDate) : new Date(),
      endDate: assignment?.endDate ? new Date(assignment.endDate) : null,
    },
  });

  const onSubmit = async (data: z.infer<typeof assignmentSchema>) => {
    try {
      // Obter nome do funcionário (Colaborador) pelo ID
      const { data: colaboradorData } = await customTables.colaboradores.getById(data.employeeId);
      const colaborador = colaboradorData as Colaborador | null;
      
      if (isEditing && assignment) {
        const assignmentIndex = mockAssignments.findIndex(a => a.id === assignment.id);
        
        if (assignmentIndex !== -1) {
          const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
          
          mockAssignments[assignmentIndex] = {
            ...mockAssignments[assignmentIndex],
            vehicleId: data.vehicleId,
            vehiclePlate: vehicle?.plate || 'Desconhecido',
            employeeId: data.employeeId,
            employeeName: colaborador?.nome || 'Desconhecido',
            startDate: data.startDate,
            endDate: data.endDate,
            isActive: data.endDate ? new Date() < data.endDate : true
          };
        }
      } else {
        const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
        
        const newAssignment = {
          id: `assignment-${Date.now()}`,
          vehicleId: data.vehicleId,
          vehiclePlate: vehicle?.plate || 'Desconhecido',
          employeeId: data.employeeId,
          employeeName: colaborador?.nome || 'Desconhecido',
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.endDate ? new Date() < data.endDate : true
        };
        
        mockAssignments.push(newAssignment);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao processar designação:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funcionário</FormLabel>
              <FormControl>
                <ColaboradorSelect 
                  value={field.value} 
                  onValueChange={field.onChange}
                  placeholder="Selecione o funcionário"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fim</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      fromDate={form.getValues("startDate")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </form>
    </Form>
  );
}
