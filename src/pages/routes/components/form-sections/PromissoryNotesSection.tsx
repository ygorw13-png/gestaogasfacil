import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

// Mock data - keep it here for now since it's specific to this component
const mockPromissoryNotes = [
  { id: "1", clientName: "Maria Silva", amount: 150.00, dueDate: "2025-05-01" },
  { id: "2", clientName: "José Santos", amount: 200.00, dueDate: "2025-05-05" },
  { id: "3", clientName: "Ana Oliveira", amount: 180.00, dueDate: "2025-05-10" },
];

interface PromissoryNotesSectionProps {
  control: Control<RouteFormSchema>;
}

export function PromissoryNotesSection({ control }: PromissoryNotesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {mockPromissoryNotes.map((note) => (
          <div key={note.id} className="flex items-center space-x-2">
            <FormField
              control={control}
              name="promissoryNotesToCollect"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value.includes(note.id)}
                      onChange={(e) => {
                        const updatedValue = e.target.checked
                          ? [...field.value, note.id]
                          : field.value.filter((id) => id !== note.id);
                        field.onChange(updatedValue);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="text-sm">
                    <p className="font-medium">{note.clientName}</p>
                    <p className="text-muted-foreground">
                      R$ {note.amount.toFixed(2)} - Vence: {new Date(note.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
