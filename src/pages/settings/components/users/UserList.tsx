import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { supabase } from "@/integrations/supabase/client";
import { Key, Trash2, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: UserRole;
  ativo?: boolean;
}

interface UserListProps {
  users: User[];
  loading: boolean;
  onAddUserClick: () => void;
  onUserRemoved?: (id: string) => void;
  onUserToggled?: (id: string, ativo: boolean) => void;
}

export function UserList({ users, loading, onAddUserClick, onUserRemoved, onUserToggled }: UserListProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const call = async (action: string, target_user_id: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: { action, target_user_id, ...extra },
    });
    if (error || data?.error) throw new Error(error?.message || data?.error);
  };

  const handleReset = async () => {
    if (!resetUser) return;
    if (newPwd.length < 8) {
      toast({ title: "Senha deve ter ao menos 8 caracteres", variant: "destructive" });
      return;
    }
    setBusy(resetUser.id);
    try {
      await call("reset_password", resetUser.id, { new_password: newPwd });
      toast({ title: `Senha de ${resetUser.name} redefinida` });
      setResetUser(null);
      setNewPwd("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleToggle = async (u: User) => {
    setBusy(u.id);
    try {
      const newActive = !(u.ativo ?? true);
      await call("toggle_active", u.id, { active: newActive });
      toast({ title: newActive ? "Usuário ativado" : "Usuário desativado" });
      onUserToggled?.(u.id, newActive);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setBusy(deleteUser.id);
    try {
      await call("delete", deleteUser.id);
      toast({ title: `${deleteUser.name} excluído` });
      onUserRemoved?.(deleteUser.id);
      setDeleteUser(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Usuários da sua Organização</h2>
        <Button onClick={onAddUserClick}>Adicionar Usuário</Button>
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground">Não há usuários cadastrados</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => {
                const ativo = u.ativo ?? true;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{roleLabels[u.role as UserRole] ?? u.role}</TableCell>
                    <TableCell>
                      <Badge variant={ativo ? "default" : "secondary"}>
                        {ativo ? "Ativo" : "Desativado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" disabled={busy === u.id}
                        onClick={() => { setResetUser(u); setNewPwd(""); }}>
                        <Key className="h-4 w-4 mr-1" /> Senha
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === u.id}
                        onClick={() => handleToggle(u)}>
                        {ativo ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                        {ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busy === u.id}
                        onClick={() => setDeleteUser(u)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onOpenChange={o => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder="Mínimo 8 caracteres" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancelar</Button>
            <Button onClick={handleReset} disabled={!!busy}>Redefinir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={o => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O usuário perderá acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
