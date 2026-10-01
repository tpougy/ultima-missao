# Votação do Cardápio — Design

## Objetivo

Adicionar uma página de **Cardápio** ao portal da Última Missão, onde os
participantes votam nos itens de alimentação da viagem, e um **Admin** onde o
organizador configura dias, sessões e itens. O Cardápio vira a página default;
a votação de data continua disponível pela navbar.

## Decisões (confirmadas com o usuário)

- **Identidade reaproveitada**: votante do cardápio = participante existente
  (nome único, `participants`) que optou por participar.
- **Sair da votação**: a pessoa pode sair; seus votos **ficam guardados mas não
  contam**. Se voltar, voltam a valer.
- **Rotas**: hash routing, sem dependências novas.
- **Quem votou**: popover (i) com nomes em cada item, como no `WeekendCard`.
- **Sessões gerais**: sessões sem dia (ex.: café da manhã comprado uma vez para a
  viagem toda) ficam num card "Geral".

## Modelagem (InstantDB)

| Entidade | Campos | Notas |
|---|---|---|
| `participants` (existente) | `+ menuVoter: boolean` (optional, indexed) | `undefined` = nunca respondeu (mostra opt-in); `true` = votante; `false` = só acompanha. |
| `menuSettings` | `payingCount: number?`, `arrivalDate: string?`, `departureDate: string?` | Registro único com UUID fixo em código (`MENU_SETTINGS_ID`), gravado via `update` (upsert). |
| `menuSessions` | `date: string?` (ISO, indexed), `name: string`, `order: number` (indexed) | `order` define a posição dentro do card (nova sessão = maior `order` do card + 1). `date` ausente ⇒ sessão do card **Geral**. Dias não são entidade: derivam do intervalo chegada→saída. |
| `menuItems` | `name: string`, `price: number`, `quantity: string?`, `description: string?`, `order: number` (indexed) | `price` = custo **total** do item. `quantity` é só descritiva. `order` define a posição dentro da sessão (novo item = maior `order` da sessão + 1). |

Links:

- `sessionItems`: `menuItems.session` (has one, `onDelete: cascade`) ↔
  `menuSessions.items` (has many).
- `menuItemLikes`: `menuItems.likedBy` (has many) ↔
  `participants.likedMenuItems` (has many). **Voto = link**; desvotar = `unlink`.
  Sem entidade de voto. Remover participante ou item remove o link.

Perms: abertas (`"true"`) para as novas entidades, igual às existentes.

## Regras de negócio (`src/lib/menu.ts`, funções puras)

- `tripDays(arrival, departure)`: lista de datas ISO inclusivas; vazia se faltar
  uma das datas ou se saída < chegada.
- `votantes` = participantes com `menuVoter === true`.
- `support(item, voterIds)` = nº de `likedBy` que estão em `voterIds`.
- `isInMenu(support, voterCount)` = `voterCount > 0 && support * 2 >= voterCount`
  (1/2 entra, 1/3 não, 2/4 entra).
- `menuTotal(items, voterIds)` = Σ `price` dos itens no cardápio, só de sessões
  visíveis (sessões gerais + sessões cuja data está no período).
- Custo por pessoa = `total / payingCount`, calculado **somente na UI**; exibe
  "—" se `payingCount` não for > 0.
- Tudo derivado de uma única `useQuery` reativa → entrada/saída de votantes e
  votos recalculam denominadores, cardápio e totais em tempo real para todos.

## Rotas e integração

- `src/lib/router.svelte.ts`: `$state` com a rota atual lida de `location.hash`,
  atualizada em `hashchange`; `navigate(route)`. Rotas: `cardapio` (default e
  fallback), `cardapio/admin`, `data`, `data/admin`.
- `App.svelte` mantém a ordem dos gates: senha do app → identidade. Depois deles
  renderiza `NavBar.svelte` + a página da rota.
- `NavBar.svelte`: abas *Cardápio | Data*, "Olá, **nome** · Trocar usuário"
  (removido do `MainView`) e link *Admin* para o admin da seção atual.
- Admins (de data e de cardápio) continuam atrás do `PasswordGate` existente,
  com a mesma senha e o mesmo `adminUnlocked`. "Voltar"/"Fechar" navegam para a
  página pública da seção.
- `MainView`/`AdminPanel` mantêm comportamento; só perdem a topbar própria
  (o `AdminPanel` mantém o título e "Fechar").

## Página pública — `MenuView.svelte`

- `menuVoter === undefined` → tela de opt-in no estilo dos gates:
  "Quero participar da votação do cardápio" (→ `true`) /
  "Só quero acompanhar" (→ `false`).
- **Header sticky** (`position: sticky; top: 0`): custo por pessoa em destaque,
  custo total menor e em cinza, linha discreta "N votantes · M pagantes".
- Não-votante vê um aviso "Você está só acompanhando · Participar". Votante vê
  link "Sair da votação" (com `confirm()`).
- Cards grandes: **Geral** primeiro (só se tiver sessões), depois um por dia do
  período ("SEX 12 · Dezembro"); dias sem sessões ficam ocultos.
- Dentro do card: sessões na ordem definida; dentro da sessão, itens na ordem
  definida no admin. Cada item: nome em destaque com quantidade ao lado (se houver),
  descrição abaixo (se houver, quebra de linha natural), preço à direita, placar
  `apoio/votantes`, botão (i) com nomes de quem votou.
- Votante toca no item para alternar o voto (link/unlink). Item no cardápio
  ganha destaque verde (accent). Não-votante vê tudo em modo leitura.

## Admin — `MenuAdmin.svelte`

- Inputs globais salvos no `onchange`: pagantes (number), chegada e saída (date).
  Se o novo período deixar sessões **datadas** fora dele → `confirm()` e apaga
  essas sessões (cascade apaga itens). Sessões gerais nunca são afetadas.
- Card **Geral** sempre visível no topo; depois um card por dia do período.
- Em cada card: sessões com nome editável, ↑↓, remover (`confirm()`),
  formulário "+ sessão".
- Em cada sessão: itens editáveis inline (nome, preço, quantidade, descrição),
  ↑↓, remover, formulário "+ item", placar `apoio/votantes` visível.
- **Reordenação** (sessões no card e itens na sessão): ↑ desabilitado no
  primeiro, ↓ no último; mover = trocar o `order` com o vizinho numa única
  `db.transact` com dois `update`. Helper puro `swapOrder(list, index, dir)` em
  `menu.ts` devolve os dois pares `{id, order}` a gravar. Se houver empate de
  `order` (ex.: criação concorrente), a lista é desempatada por `id` para manter
  a ordem estável.
- Seção "Votantes" listando os nomes atuais.

## Testes e verificação

- `bun test` para `src/lib/menu.ts`: `tripDays` (inclusivo, inválido, virada de
  mês), limiar 50% (1/2, 1/3, 2/4, 0 votantes), likes de não-votantes ignorados,
  total só com itens no cardápio e só sessões visíveis, `swapOrder`
  (meio, extremos, empates).
- `bun run check`, `bun run build`, `bun run instant:push` (schema + perms).
- Teste manual ponta a ponta no navegador: Admin configura → opt-in → votos →
  entrada de novo votante muda denominador → itens entram/saem → totais mudam.

## Fora de escopo

- Mover sessão entre dias ou item entre sessões (apagar e recriar).
- Drag-and-drop (setas são mais confiáveis no celular e não exigem dependência).
- Custos por pessoa armazenados no banco.
