
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

interface NotesSectionProps {
  control: Control<RouteFormSchema>;
}

export function NotesSection({ control }: NotesSectionProps) {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Informações adicionais sobre a rota"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
