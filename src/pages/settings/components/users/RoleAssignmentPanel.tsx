import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  users: { id: string; name: string; role: UserRole }[];
  onUpdated?: (userId: string, role: UserRole) => void;
}

export function RoleAssignmentPanel({ users, onUpdated }: Props) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<UserRole>("entregador");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "Selecione um usuário", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("set_user_role" as any, {
      _user_id: userId,
      _role: role,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Permissão atualizada", description: `${roleLabels[role]} aplicado.` });
    onUpdated?.(userId, role);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Atribuir Função
        </CardTitle>
        <CardDescription>
          Defina o papel do usuário. <strong>Entregador</strong> só vê as telas de entrega no celular.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">Usuário</label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name} — {roleLabels[u.role] ?? u.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Função</label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as UserRole[]).map(r => (
                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar permissão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
