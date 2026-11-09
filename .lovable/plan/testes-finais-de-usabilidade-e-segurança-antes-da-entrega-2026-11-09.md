# Testes finais de usabilidade e segurança antes da entrega

## 1. Testes automáticos
- Rodar os testes de cálculo (DRE, furo de bar, consignado, comissões) e de navegação.

## 2. Usabilidade no navegador (celular 360px e 390px, e computador 1280px)
- Dashboard: cards, gráfico com Top 10 / Prejuízos / Todos, rolagem com muitos eventos, relatório.
- Eventos: criar evento, lançar caixas, camarotes, custos, bar e cortesias; conferir o DRE.
- Financeiro: criar conta a pagar e a receber e tocar no S/N.
- Menu no celular, Ajustes e Usuários (salvar).
- Capturas de tela de cada tela para comprovar.

## 3. Segurança
- Entrar como gerente e confirmar que Ajustes e Usuários ficam bloqueados e que só aparecem as empresas dele.
- Revisar o código procurando chaves expostas e campos sem limite de tamanho ou valores inválidos (números negativos, texto vazio).
- Corrigir os problemas que eu encontrar.

## 4. Preparar a entrega
- Trocar o seed pela versão sem dados fictícios (3 empresas, configurações e o diretor).
- Lembrar você de apagar `rocket-gestao/db-v1` no Firestore e publicar as novas regras.

## Observação
- Aqui os testes rodam no modo local, sem o Firebase. O login real e as regras precisam ser conferidos em adm-rocket.vercel.app depois do git push.
