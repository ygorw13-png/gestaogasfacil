import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { AlertTriangle, CheckCircle2, CloudOff, Cloud, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function formatDate(ts: number | null) {
  if (!ts) return 'ainda não sincronizado';
  return new Date(ts).toLocaleString('pt-BR');
}

export default function StatusOffline() {
  const { online, queue, pendingCount, errors, lastSyncAt, syncing, sync, discard } = useOfflineSync();

  const handleSync = async () => {
    const result = await sync();
    if (result.skipped) {
      toast.error('Sem internet no momento. Vamos tentar de novo automaticamente.');
    } else if (result.failed > 0) {
      toast.warning(`${result.sent} enviado(s), ${result.failed} com erro.`);
    } else {
      toast.success(result.sent > 0 ? `${result.sent} lançamento(s) enviado(s)!` : 'Tudo já está sincronizado.');
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Modo Offline</h1>
        <p className="text-muted-foreground text-sm">
          Aqui você vê se o sistema está conectado, o que ainda falta enviar e possíveis erros.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conexão</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              {online ? (
                <>
                  <Cloud className="h-5 w-5 text-emerald-500" /> Online
                </>
              ) : (
                <>
                  <CloudOff className="h-5 w-5 text-amber-500" /> Offline
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {online
              ? 'Os lançamentos vão direto para a nuvem.'
              : 'Pode continuar trabalhando: tudo será enviado quando a internet voltar.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Última sincronização</CardDescription>
            <CardTitle className="text-xl">{formatDate(lastSyncAt)}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Momento em que os dados foram enviados com sucesso.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando envio</CardDescription>
            <CardTitle className="text-xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSync} disabled={syncing} size="sm" className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar agora
            </Button>
          </CardContent>
        </Card>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{errors.length} lançamento(s) com erro</AlertTitle>
          <AlertDescription>
            Eles continuam salvos no aparelho. Tente sincronizar novamente ou descarte se não forem mais necessários.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lançamentos pendentes</CardTitle>
          <CardDescription>Ficam guardados no aparelho até serem enviados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Nada pendente. Tudo em dia!
            </div>
          )}
          {queue.map((op) => (
            <div
              key={op.id}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{op.description}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(op.createdAt).toLocaleString('pt-BR')} · tentativas: {op.attempts}
                </p>
                {op.lastError && <p className="text-destructive mt-1 text-xs break-words">{op.lastError}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={op.lastError ? 'destructive' : 'secondary'}>
                  {op.lastError ? 'Erro' : 'Na fila'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => discard(op.id)} aria-label="Descartar">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
