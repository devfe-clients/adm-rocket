# Corrigir cadastro de usuários (campo que some + usuária bloqueada)

## Causas encontradas

1. **A linha nova some enquanto você digita**
   A tela de Usuários recarrega a lista inteira toda vez que o banco manda uma atualização em tempo real (a sincronização que colocamos). Qualquer atualização (de outro aparelho, backup, reconexão — o console mostra a conexão do Firestore caindo e voltando) apaga a linha que ainda não foi salva.

2. **Ela não aparece como usuária**
   O e-mail na tela é `p.anasouza.2603@gmail.com`, mas a conta testada antes era `p.ana.souza.2603@gmail.com` (com ponto). São contas diferentes para o sistema: ela entra com um e-mail que não está na lista. Além disso, se a linha sumiu antes de salvar (causa 1), ela nunca foi gravada.

3. **Ela é bloqueada ao lançar**
   - Se a regra do Firebase ainda exige o e-mail em `authorized-emails`, toda gravação dela é recusada.
   - Como gerente, ela só lança nas casas marcadas para o e-mail exato que está na lista.

## O que vamos mudar

- **Tela de Usuários**: a lista não é mais substituída enquanto houver alterações não salvas. Atualizações de outros aparelhos só entram quando não há edição em andamento (ou depois de salvar).
- **E-mail**: normalizar (minúsculo, sem espaços) e avisar se já existir conta com e-mail parecido.
- **Lançamentos bloqueados**: mostrar aviso claro quando o Firebase recusar a gravação (hoje falha em silêncio e "não vai").
- **O que você faz no Firebase**: confirmar que a função `autorizado()` nas regras está na versão sem `authorized-emails`, e conferir qual e-mail exato a Ana usa no login.

## Detalhes técnicos
- `src/routes/usuarios.tsx`: trocar o `useEffect(() => setUserList(db.users), [db.users])` por uma sincronização com flag `dirty`; reset após salvar.
- `src/lib/store.tsx`: no `catch` do `repo.update`, `toast.error` com a mensagem de permissão.
- Entrega como diffs antes/depois para você aplicar.
