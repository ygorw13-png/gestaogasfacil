/**
 * Dono de cada lançamento da fila offline (módulo puro, testável).
 * Um aparelho pode ser usado por mais de uma conta: a fila de uma conta NUNCA é enviada pela sessão de outra
 * (o servidor gravaria o lançamento em nome de quem está logado agora).
 */
export type DecisaoDono = "enviar" | "aguardar_sessao" | "outra_conta" | "sem_dono";

/**
 * @param dono    ID da conta que criou o lançamento (vazio = versão anterior do app, sem registro do dono)
 * @param atual   ID da conta logada; `null` = ninguém logado; `undefined` = ambiente sem autenticação (testes)
 * @param forcado a pessoa confirmou o envio de um lançamento sem dono
 */
export function decidirEnvio(dono: string | undefined, atual: string | null | undefined, forcado = false): DecisaoDono {
  if (atual === undefined) return "enviar";
  if (atual === null) return "aguardar_sessao";
  if (!dono) return forcado ? "enviar" : "sem_dono";
  return dono === atual ? "enviar" : "outra_conta";
}

/** Recusa do servidor (permissão, regra, saldo): reenviar não muda nada; precisa de atenção. */
export function ehRecusaDefinitiva(acao: string, mensagem: string, ehErroDeRede: (m: string) => boolean): boolean {
  return acao === "rpc" && !ehErroDeRede(mensagem);
}
