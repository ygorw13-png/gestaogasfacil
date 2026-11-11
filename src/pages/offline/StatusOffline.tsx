import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import type { ExceedAction } from '@/lib/offline/config';
import { AlertTriangle, CheckCircle2, CloudOff, Cloud, RefreshCw, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function formatDate(ts: number | null) {
  if (!ts) return 'ainda não sincronizado';
  return new Date(ts).toLocaleString('pt-BR');
}

export default function StatusOffline() {
  const {
    online,
    queue,
    pendingCount,
    conflicts,
    exceeded,
    errors,
    lastSyncAt,
    syncing,
    progress,
    config,
    updateConfig,
    sync,
    retry,
    discard,
  } = useOfflineSync();

  const handleSync = async () => {
    const result = await sync();
    if (result.blocked) {
      toast.warning(`${result.blocked} lançamento(s) antigos não enviados. Confira o motivo na lista.`);
    } else if (result.skipped) {
      toast.info('Nada para enviar agora ou aguardando a próxima tentativa.');
    } else if (result.conflicts > 0) {
      toast.warning(`${result.conflicts} lançamento(s) precisam da sua confirmação.`);
    } else if (result.failed > 0) {
      toast.warning(`${result.sent} enviado(s), ${result.failed} com erro.`);
    } else {
      toast.success(result.sent > 0 ? `${result.sent} lançamento(s) enviado(s)!` : 'Tudo já está sincronizado.');
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

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
                  <CloudOff className="text-amber-500 h-5 w-5" /> Offline
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
            O envio acontece sozinho em segundo plano, mesmo com esta tela fechada.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando envio</CardDescription>
            <CardTitle className="text-xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {progress.running && (
              <div className="space-y-1">
                <Progress value={pct} />
                <p className="text-muted-foreground text-xs">
                  Enviando {progress.done} de {progress.total}…
                </p>
              </div>
            )}
            <Button onClick={handleSync} disabled={syncing} size="sm" className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar agora
            </Button>
          </CardContent>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{conflicts.length} lançamento(s) podem estar duplicados</AlertTitle>
          <AlertDescription>
            O sistema encontrou algo parecido já salvo na nuvem. Confirme "Enviar mesmo assim" só se tiver certeza de
            que é um lançamento diferente.
          </AlertDescription>
        </Alert>
      )}

      {exceeded.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{exceeded.length} lançamento(s) passaram do limite de tentativas</AlertTitle>
          <AlertDescription>Revise o erro, tente de novo manualmente ou descarte.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajustes de reenvio</CardTitle>
          <CardDescription>
            Defina de quanto em quanto tempo o sistema tenta de novo e o que fazer quando não conseguir.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Primeira espera (segundos)</Label>
            <Input
              type="number"
              min={5}
              value={config.baseDelaySec}
              onChange={(e) => void updateConfig({ baseDelaySec: Math.max(5, +e.target.value || 5) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Multiplicador da espera</Label>
            <Input
              type="number"
              min={1}
              step="0.5"
              value={config.factor}
              onChange={(e) => void updateConfig({ factor: Math.max(1, +e.target.value || 1) })}
            />
            <p className="text-muted-foreground text-xs">2 = dobra a espera a cada tentativa.</p>
          </div>
          <div className="space-y-2">
            <Label>Espera máxima (segundos)</Label>
            <Input
              type="number"
              min={30}
              value={config.maxDelaySec}
              onChange={(e) => void updateConfig({ maxDelaySec: Math.max(30, +e.target.value || 30) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Limite de tentativas</Label>
            <Input
              type="number"
              min={1}
              value={config.maxAttempts}
              onChange={(e) => void updateConfig({ maxAttempts: Math.max(1, +e.target.value || 1) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Verificar a cada (segundos)</Label>
            <Input
              type="number"
              min={10}
              value={config.pollIntervalSec}
              onChange={(e) => void updateConfig({ pollIntervalSec: Math.max(10, +e.target.value || 10) })}
            />
            <p className="text-muted-foreground text-xs">Vale a partir da próxima abertura do app.</p>
          </div>
          <div className="space-y-2">
            <Label>Quando exceder o limite</Label>
            <Select
              value={config.onExceed}
              onValueChange={(v) => void updateConfig({ onExceed: v as ExceedAction })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perguntar">Perguntar (avisar e aguardar)</SelectItem>
                <SelectItem value="manter">Manter na fila e continuar tentando</SelectItem>
                <SelectItem value="descartar">Descartar automaticamente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && conflicts.length === 0 && exceeded.length === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{errors.length} lançamento(s) com erro</AlertTitle>
          <AlertDescription>
            Eles continuam salvos no aparelho. Confira o motivo de cada lançamento antes de tentar novamente.
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
                  {op.nextAttemptAt && op.nextAttemptAt > Date.now()
                    ? ` · próxima tentativa às ${new Date(op.nextAttemptAt).toLocaleTimeString('pt-BR')}`
                    : ''}
                </p>
                {op.lastError && <p className="text-destructive mt-1 text-xs break-words">{op.lastError}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={
                    op.status === 'conflito' || op.status === 'outra_conta'
                      ? 'outline'
                      : op.status === 'excedido' || op.status === 'recusado'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {op.status === 'bloqueado' ? 'Não enviado' : op.status === 'conflito'
                    ? 'Confirmar'
                    : op.status === 'excedido'
                      ? 'Excedido'
                      : op.status === 'recusado'
                        ? 'Recusado (não gravado)'
                        : op.status === 'outra_conta'
                          ? 'Outra conta'
                          : 'Na fila'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={op.status === 'bloqueado'}
                  onClick={() => void retry(op.id, op.status === 'conflito')}
                >
                  <Send className="mr-1 h-3.5 w-3.5" />
                  {op.status === 'conflito' ? 'Enviar mesmo assim' : 'Tentar agora'}
                </Button>
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
