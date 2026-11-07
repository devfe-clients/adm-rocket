# Rocket Gestão Integrada

Construir um software de gestão completo e responsivo (perfeito tanto para mobile/celular quanto desktop) para as empresas Rocket BEACH, Rocket SEA e Rocket EVENTOS, com separação de faturamento e custos para cada empresa não se misturar, e visão consolidada para os diretores.

Requisitos fundamentais:
1. Dashboard Analytics e Relatório Geral:
   - Filtros por empresa (Rocket Beach, Rocket Sea, Rocket Eventos, Todas) e período (Mês/Ano).
   - Indicadores principais: Faturamento Total, Custos Totais, Lucro Líquido, Contas a Pagar Pendentes.
   - Destaque claro de performance dos eventos: quais eventos deram maior lucro e quais deram prejuízo (com indicador visual em vermelho para prejuízos).
   - Relatório detalhado logo abaixo do dashboard com listagem completa e consolidada das operações, receitas, despesas e margens do período.

2. Gestão e Fechamento de Eventos (Unificando MODELO-EVENTO-ROCKET.xlsx e FELIPE RET ROCKET - Fechamento.xlsx):
   - Identificação do evento: Casa (Beach, Sea, Eventos), Nome, Data, Produtor/Parceiro, % de divisão do lucro da casa vs parceiro.
   - Caixas da Noite: lançamento manual por operador de caixa (Cartão, Dinheiro, PIX, Devoluções e sangrias de pagamentos em espécie na madrugada).
   - Camarotes: Lote/Camarote, Nome do Cliente, Valor de Venda, Consumação concedida, Sinal antecipado, Saldo na porta (Cartão/Dinheiro) e Vendedor/Promoter responsável.
   - Custos do Evento categorizados: Estrutura, Atrações/Logística, Pessoal/Equipe, Divulgação/Marketing, Bar/Insumos.
   - Bar e Estoque: contagem física de estoque inicial e final de cada garrafa/produto, custo unitário, conferência com vendas e perdas/furos sem registro, com distinção de produtos da Casa vs Consignado (conforme MODELO-EVENTO-ROCKET.xlsx), além de registro de Gerência (cortesias a R$ 0,00).
   - Resumo DRE do Evento automático com receita total de entradas, total de custos, lucro líquido do evento e repasse de sócios/parceiros.

3. Financeiro da Casa (Contas a Pagar e Contas a Receber):
   - Contas a Pagar: Nome/Fornecedor, Empresa vinculada (Beach, Sea, Eventos), Valor, Vencimento, Categoria, Tipo (Despesa ou Investimento) e status Pago Sim/Não com toggle rápido (S/N).
   - Contas a Receber / Faturamento: Nome do Cliente/Origem, Data, Valor, Vencimento e status Pago Sim/Não com toggle rápido (S/N).

4. Tela de Configurações:
   - Modo de conferência de bar: alternar entre contagem detalhada garrafa a garrafa (habilitada por padrão) ou lançamento consolidado de valor.
   - Modo de comissões de camarote: alternar entre comissão percentual fixa por vendedor ou valor negociado livremente por evento.
   - Gerenciamento de empresas e categorias.

5. Usuários e Permissões:
   - Níveis de acesso: Diretores (veem todas as empresas, faturamento global, DRE e configurações) e Gerentes/Operadores (lançamentos operacionais).

6. Arquitetura e Integrações:
   - Estrutura de banco e serviços modular preparada para Firebase (Firestore Spark) e deploy na Vercel, com arquivo de configuração de variáveis de ambiente/keys pronto para fácil preenchimento. Design limpo, ágil para telas touch em mobile e com suporte a mock/dados locais imediatos enquanto as credenciais finais são inseridas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b76e3003-1c52-45e2-a10b-cc0d21ffa52b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
