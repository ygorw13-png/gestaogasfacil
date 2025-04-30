
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

interface PromissoryNotesSectionProps {
  control: Control<RouteFormSchema>;
}

export function PromissoryNotesSection({ control }: PromissoryNotesSectionProps) {
  const [noteId, setNoteId] = useState<string>("");

  const handleAddNote = (field: { value: string[], onChange: (value: string[]) => void }) => {
    if (noteId.trim()) {
      field.onChange([...field.value, noteId.trim()]);
      setNoteId("");
    }
  };

  const handleRemoveNote = (field: { value: string[], onChange: (value: string[]) => void }, index: number) => {
    const newNotes = field.value.filter((_, i) => i !== index);
    field.onChange(newNotes);
  };

  return (
    <FormField
      control={control}
      name="promissoryNotesToCollect"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Adicionar Nota Promissória</FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                type="text"
                placeholder="Digite o número da nota promissória"
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
                className="flex-1"
              />
            </FormControl>
            <Button
              type="button"
              onClick={() => handleAddNote(field)}
            >
              Adicionar
            </Button>
          </div>
          
          {field.value.length > 0 && (
            <div className="mt-4 space-y-2">
              <FormLabel>Notas Adicionadas:</FormLabel>
              <div className="space-y-2">
                {field.value.map((note, index) => (
                  <div key={note} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <span>Nota #{note}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNote(field, index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormItem>
      )}
    />
  );
}
