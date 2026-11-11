/**
 * Controle da chave de reenvio de UMA operação de tela (venda, pedido…).
 * Módulo puro (sem React nem rede) para poder ser testado sozinho.
 *
 * Regras:
 *  - mesma operação (mesmo conteúdo) tentada de novo = mesma chave;
 *  - operação nova, mesmo com os mesmos produtos e valores = outra chave
 *    (o chamador chama `confirmar()` quando o envio é confirmado);
 *  - falha DEFINITIVA (o servidor respondeu recusando, nada foi gravado) libera a chave;
 *  - falha INCERTA (sem resposta: rede, tempo esgotado) mantém a chave e marca dúvida;
 *  - com dúvida aberta, mudar o conteúdo NÃO reaproveita a chave nem gera outra em silêncio:
 *    lança ConteudoAlteradoError e a tela precisa de uma decisão explícita (`descartarDuvida`).
 *  O servidor também confere (hash do conteúdo gravado com a chave); isto aqui evita o erro antes.
 */

export class ConteudoAlteradoError extends Error {
  constructor() {
    super(
      "O envio anterior não teve resposta e pode ter sido gravado. Confira a lista de vendas de hoje; " +
        "se não estiver lá, reenvie os mesmos dados ou descarte a tentativa anterior.",
    );
    this.name = "ConteudoAlteradoError";
  }
}

/** Texto estável do conteúdo: chaves ordenadas, undefined ignorado, números normalizados. */
export function assinaturaConteudo(v: unknown): string {
  const norm = (x: unknown): unknown => {
    if (x === undefined) return undefined;
    if (x === null) return null;
    if (typeof x === "number") return Number.isFinite(x) ? Number(x.toFixed(6)) : String(x);
    if (typeof x === "string") return x.trim();
    if (Array.isArray(x)) return x.map((i) => norm(i) ?? null);
    if (typeof x === "object") {
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(x as object).sort()) {
        const n = norm((x as Record<string, unknown>)[k]);
        if (n !== undefined) o[k] = n;
      }
      return o;
    }
    return x;
  };
  return JSON.stringify(norm(v));
}

/**
 * Erro sem resposta confiável do servidor (a gravação pode ter acontecido).
 * Erros do PostgREST/banco trazem `code` (SQLSTATE ou PGRST…) e voltaram antes de gravar.
 */
export function ehIncerta(e: { code?: string | null; status?: number | null; message?: string } | null | undefined): boolean {
  if (!e) return false;
  const status = typeof e.status === "number" ? e.status : null;
  if (status !== null && [0, 408, 502, 503, 504].includes(status)) return true;
  if (e.code) return false;
  return true;
}

export class ControleChave {
  private chave: string | null = null;
  private sig: string | null = null;
  private duvida = false;

  constructor(
    private readonly prefixo: string,
    private readonly gerar: () => string = () => globalThis.crypto.randomUUID(),
  ) {}

  /** Chave desta operação. Lança ConteudoAlteradoError se há dúvida aberta e o conteúdo mudou. */
  obter(conteudo: unknown): string {
    const s = assinaturaConteudo(conteudo);
    if (this.chave && this.sig === s) return this.chave;
    if (this.chave && this.duvida) throw new ConteudoAlteradoError();
    this.sig = s;
    this.chave = `${this.prefixo}:${this.gerar()}`;
    this.duvida = false;
    return this.chave;
  }

  /** Envio confirmado: a próxima operação, ainda que igual, terá outra chave. */
  confirmar() {
    this.chave = null;
    this.sig = null;
    this.duvida = false;
  }

  /** Envio falhou. Incerta = pode ter gravado: guarda a chave. Definitiva = nada gravado: libera. */
  falhou(incerta: boolean) {
    if (incerta) this.duvida = true;
    else this.confirmar();
  }

  temDuvida() {
    return this.duvida;
  }

  /** Decisão explícita da pessoa: tratar a próxima tentativa como operação nova. */
  descartarDuvida() {
    this.confirmar();
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identificador (uuid) embutido na chave "prefixo:uuid". Serve para gravações diretas que aceitam
 * `id` vindo do cliente (um reenvio bate na chave primária em vez de criar outro registro).
 */
export function idDaChave(chave: string): string {
  const id = chave.slice(chave.indexOf(":") + 1);
  if (!UUID.test(id)) throw new Error("Chave de operação inválida");
  return id;
}

/** O erro indica que a gravação pode ter acontecido? Erros locais (validação antes de enviar) não. */
export function falhaIncerta(e: unknown): boolean {
  if (e && typeof e === "object") {
    const o = e as { incerta?: unknown; code?: unknown; status?: unknown };
    if (typeof o.incerta === "boolean") return o.incerta;
    if ("code" in o || "status" in o) return ehIncerta(o as { code?: string; status?: number });
  }
  return false;
}
