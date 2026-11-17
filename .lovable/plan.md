# Gabriela: campo some, não aparece na lista e é bloqueada

## O que está acontecendo (provável, não confirmado com dados)

1. **A linha nova some enquanto digita**
   A tela de Usuários recria a lista toda vez que chega uma atualização do Firebase em tempo real. Qualquer atualização (outro aparelho, reconexão — o console mostra a conexão do Firestore caindo) apaga a linha ainda não salva.

2. **Gabriela não aparece na lista**
   Ela existe em `authorized-emails` (criada à mão no Firebase), mas não está na lista de usuários do sistema. Quando ela entra, o login a adiciona sozinho — só que, se o Fábio estiver com a tela de Usuários aberta (lista antiga, sem ela) e clicar em Salvar, a lista dele substitui a do banco e ela é apagada de novo.

3. **Ela é bloqueada ao lançar**
   As regras do Firebase já estão corretas (não exigem mais `authorized-emails`). Como ela não está na lista, o sistema não sabe as casas dela, e a gravação falha sem mostrar erro — "não vai".

## Arquivos para enviar ao Claude
- `src/routes/usuarios.tsx`
- `src/services/auth.ts`
- `src/lib/store.tsx`
- `src/services/firebase-admin.server.ts`
- `src/services/firebaseRepository.ts`
- `src/lib/types.ts`

## Prompt para o Claude

```text
Projeto Rocket Gestão (React + Firebase, todo o banco num documento rocket-gestao/db-v1, salvo via runTransaction). Três bugs na tela de Usuários, com a usuária Gabriela (lelagabriela23@gmail.com):

1) Ao clicar "Adicionar usuário" e digitar, a linha some. Causa: em usuarios.tsx, useEffect(() => setUserList(db.users), [db.users]) sobrescreve a lista local a cada snapshot do Firestore. Corrija: só sincronizar db.users -> userList quando não houver alterações não salvas (flag dirty); após salvar com sucesso, limpar dirty e sincronizar.

2) Gabriela está em authorized-emails mas não aparece em db.users. auth.ts a adiciona no primeiro login com setDoc do documento inteiro (sem transação), e o Salvar da tela de Usuários manda a lista local inteira e faz d.users = updatedUsers, apagando quem entrou depois que a tela abriu. Corrija:
   - auth.ts: adicionar usuário novo via runTransaction (ler, inserir se o e-mail não existir, gravar), nunca setDoc do documento inteiro.
   - Salvar usuários: fazer merge com os usuários atuais do servidor dentro da transação; remover só quem o diretor apagou explicitamente na tela (guardar lista de ids removidos), nunca quem simplesmente não estava na lista local.
   - Confira firebase-admin.server.ts para não excluir contas que não estejam no payload.

3) Gerente bloqueada ao lançar: em store.tsx o catch do repo.update só faz console.error. Mostrar toast.error com mensagem clara (ex.: "Sem permissão para salvar. Peça ao diretor para conferir seu acesso.") e confirmar que, após o item 2, ela aparece com as casas marcadas.

Não altere as regras do Firestore, a estrutura do documento, nem o financeiro/eventos. Mande diffs antes/depois, só dos trechos alterados.
```

## Depois de aplicar
1. Abrir Usuários, adicionar Gabriela, marcar as casas, colocar senha e salvar (sem outra aba aberta na mesma tela).
2. Ela entra em aba anônima e faz um lançamento numa casa autorizada.
