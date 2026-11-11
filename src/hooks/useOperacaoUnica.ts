import { useCallback, useRef, useState } from "react";
import { ConteudoAlteradoError, ControleChave, falhaIncerta } from "@/lib/g1/operacao";

export class EnvioEmAndamentoError extends Error {
  constructor() {
    super("Já existe um envio em andamento. Aguarde a confirmação.");
    this.name = "EnvioEmAndamentoError";
  }
}

/**
 * Uma operação de tela por vez, com chave de reenvio presa ao conteúdo.
 *  - bloqueia envios simultâneos (a trava vale na hora, antes de qualquer re-render);
 *  - mesma operação tentada de novo após falha incerta = mesma chave;
 *  - só devolve sucesso depois que `fn` terminar (quem chama só fecha/limpa/imprime depois disso).
 * O backend é quem impede a duplicação; isto evita mandar chaves erradas.
 */
export function useOperacaoUnica(prefixo: string) {
  const [controle] = useState(() => new ControleChave(prefixo));
  const trava = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [duvida, setDuvida] = useState(false);

  const executar = useCallback(
    async <T,>(conteudo: unknown, fn: (chave: string) => Promise<T>): Promise<T> => {
      if (trava.current) throw new EnvioEmAndamentoError();
      trava.current = true;
      setEnviando(true);
      try {
        const chave = controle.obter(conteudo);
        const r = await fn(chave);
        controle.confirmar();
        setDuvida(false);
        return r;
      } catch (e) {
        if (!(e instanceof ConteudoAlteradoError)) controle.falhou(falhaIncerta(e));
        setDuvida(controle.temDuvida());
        throw e;
      } finally {
        trava.current = false;
        setEnviando(false);
      }
    },
    [controle],
  );

  const descartarDuvida = useCallback(() => {
    controle.descartarDuvida();
    setDuvida(false);
  }, [controle]);

  return { executar, enviando, duvida, descartarDuvida };
}
