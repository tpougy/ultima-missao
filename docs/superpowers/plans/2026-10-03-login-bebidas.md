# Login por e-mail, Bebidas e Comentários: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exigir login InstantDB por e-mail com apelido, encerrar a página de datas, criar a página Bebidas (grupos sugeridos por qualquer um, com admin) e comentários em bebidas e sessões do cardápio.

**Architecture:**
- `participants` continua sendo a pessoa e ganha o link `user` → `$users`.
- `App.svelte` encadeia os gates: senha → login → apelido → admin.
- As regras puras ficam em `src/lib/drinks.ts` e `src/lib/comments.ts` (testadas em `tests/`). As escritas ficam em `drinksDb.ts` e `commentsDb.ts`.
- `CommentThread.svelte` é autocontido: faz sua própria query pelo pai.

**Tech Stack:** Svelte 5 runes, InstantDB (`@instantdb/svelte` 1.0.x, `@instantdb/admin`), Bun, Vite, `bun test`, Playwright (scratchpad) para E2E.

**Spec:** `docs/superpowers/specs/2026-10-03-login-bebidas-design.md`

## Global Constraints
- **Svelte:** só runes (`$state`, `$derived`, `$effect`, `$props`); nada de sintaxe legada.
- **Dependências:** nenhuma nova. Ícones vêm de `lucide-svelte`, e as cores dos tokens de `src/app.css`.
- **Idioma:** textos de UI em pt-BR.
- **Roteamento:** por hash. Seções `cardapio | bebidas | data`; seção desconhecida → cardápio.
- **Gates:** as senhas de site e de admin continuam como estão (`gate.ts` intocado).
- **Testes:** `bun test tests/`, `bun run check` e `bun run build` passam ao fim de cada task.
- **Arquivos proibidos:** nunca ler `.env`.
- **Dados de produção:** itens, sessões e configurações do cardápio não podem ser apagados.

## Review Focus
- **Apelido em uso / apelido em branco:** mostrar erro e não criar o participant. Teste: E2E tenta apelido duplicado.
- **Sugerir bebida com nome igual a uma existente** (caixa ou acento diferentes): não duplica e aponta a existente. Teste: unit `findDuplicate` com "Vodka" vs " vódka ".
- **Comentário vazio, só espaços ou > 1000 caracteres:** não envia. Teste: unit `validateComment`.
- **Código errado no login:** mensagem de erro e permanece na etapa de código. Teste: E2E com código "000000".
- **Sair:** volta para a tela de e-mail sem perder o desbloqueio da senha do site. Teste: E2E.

---

### Task 1: Schema, perms, rotas e aba Data encerrada

**Files:**
- Modify: `instant.schema.ts`, `instant.perms.ts`. Já feito no spike:
  - entidades `drinks` e `comments`;
  - links `participantUser`, `drinkCreator`, `drinkMembers`, `commentAuthor`, `drinkComments`, `menuSessionComments`;
  - `$users` view true.
- Modify: `src/lib/router.svelte.ts`. `Section = "cardapio" | "bebidas" | "data"` e o `parse` reconhece "bebidas".
- Modify: `src/lib/components/NavBar.svelte`.
  - Abas Cardápio · Bebidas · Data.
  - O link Admin fica escondido quando `router.section === "data"`.
  - "Trocar usuário" vira "Sair" (prop `onSignOut`).
- Create: `src/lib/components/DatesClosed.svelte`. Card com o título "Votação de datas encerrada" e a lista fixa: Sábado, 31 de outubro · Domingo, 1 de novembro · Segunda, 2 de novembro de 2026.
- Delete: `MainView.svelte`, `AdminPanel.svelte`, `WeekendCard.svelte`, `MonthOverview.svelte`, `src/lib/votes.ts`. Antes, checar com grep se nada mais importa `dates.ts`. Se só eles importavam e o cardápio não usa, manter `dates.ts` mesmo assim, porque `MenuCardHeader` usa.
- Modify: `src/App.svelte`. `section === "data"` → `<DatesClosed />` (também em admin).

- [ ] Editar o router e a NavBar e criar DatesClosed.
- [ ] Remover os componentes de datas e as importações.
- [ ] `bun run check && bun run build`, depois commit `Close date voting and add drinks route`.

### Task 2: Login por e-mail e apelido

**Files:**
- Create: `src/lib/auth.ts`

```ts
import { db, id } from "./db";
import type { Participant } from "./participants";

export class NicknameTakenError extends Error {}

/** Creates the participant for a freshly logged-in user and links it. */
export async function createParticipantForUser(userId: string, nickname: string): Promise<Participant> {
  const name = nickname.trim();
  const { data } = await db.queryOnce({ participants: { $: { where: { name } } } });
  if (data.participants.length > 0) throw new NicknameTakenError(`O apelido "${name}" já está em uso.`);
  const participantId = id();
  try {
    await db.transact(db.tx.participants[participantId].update({ name }).link({ user: userId }));
  } catch {
    throw new NicknameTakenError(`O apelido "${name}" já está em uso.`);
  }
  return { id: participantId, name };
}
```

- Modify: `src/lib/participants.ts`. Fica só o tipo `Participant`; saem o storage e `createParticipant`.
- Delete: `src/lib/components/IdentityGate.svelte`
- Create: `src/lib/components/LoginGate.svelte`
  - Etapa "email": input type=email e botão "Enviar código" (`db.auth.sendMagicCode({ email })`).
  - Etapa "code": input numérico de 6 dígitos, "Entrar" (`db.auth.signInWithMagicCode({ email, code })`), "Usar outro e-mail".
  - Erro do código: "Código inválido ou expirado."
  - Botão "Qual e-mail eu usei?" alterna uma lista vinda de `db.useQuery({ participants: { user: {} } })`. Itens: `apelido — email`, só os com `user.email`, ordenados por apelido. Um clique preenche o e-mail.
- Create: `src/lib/components/NicknameGate.svelte`. Props `userId` e `email` e callbacks `onReady(participant)` e `onSignOut`. Campo apelido, botão "Continuar" e o erro `NicknameTakenError`.
- Modify: `src/App.svelte`
  - `const auth = db.useAuth()`.
  - A query `participants: { $: { where: { "user.id": auth.user?.id ?? "" } } }` só roda quando há user. Use `db.useQuery(() => auth.user ? {...} : null)` se a API aceitar função, ou `$derived` + `useQuery` conforme a assinatura do svelte SDK (checar `InstantSvelteDatabase.svelte.d.ts`).
  - Ordem dos gates: senha → `auth.isLoading`/carregando → `!auth.user` LoginGate → participant carregando → sem participant NicknameGate → admin gate → páginas.
  - `signOut = () => db.auth.signOut()`.
  - O participant é reativo (vem da query), então renomear ou apagar reflete na hora.
- [ ] Implementar, `bun run check && bun run build`, commit `Require email login with nickname`.

### Task 3: Regras e componente de comentários

**Files:**
- Create: `src/lib/comments.ts`, `tests/comments.test.ts`, `src/lib/commentsDb.ts` e `src/lib/components/CommentThread.svelte`

```ts
// comments.ts
export const COMMENT_MAX = 1000;
export interface CommentData { id: string; text: string; createdAt: number; author?: { id: string; name: string } | null }
export function validateComment(text: string): string | null {
  const t = text.trim();
  return t.length === 0 || t.length > COMMENT_MAX ? null : t;
}
export function sortComments<T extends CommentData>(list: T[]): T[] {
  return [...list].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
export function canDeleteComment(c: CommentData, participantId: string, admin: boolean): boolean {
  return admin || c.author?.id === participantId;
}
```

Testes de `tests/comments.test.ts`:
- `validateComment`: `"  oi  "` → `"oi"`; `""` e `"   "` → null; 1000 caracteres ok; 1001 → null.
- `sortComments`: ordena por `createdAt` e desempata por id, sem mutar a entrada.
- `canDeleteComment`: autor true, outro false, admin true, comentário sem autor e não admin false.

`commentsDb.ts`:
- `type CommentParent = { kind: "drink" | "menuSession"; id: string }`
- `addComment(parent, participantId, text)` cria com `createdAt: Date.now()` e linka `author` e `[parent.kind]`.
- `deleteComment(id)`.

`CommentThread.svelte`:
- **Props:** `parent: CommentParent`, `participantId: string`, `admin?: boolean`.
- **Query própria:** `comments: { $: { where: { "drink.id" | "menuSession.id": parent.id } }, author: {} }`.
- **Botão recolhível** "Comentários (N)" com o ícone `MessageCircle`. Começa fechado.
- **Aberto:** lista com autor em negrito, horário `dd/mm HH:mm` e texto (`white-space: pre-wrap`); lixeira quando `canDeleteComment`, com confirm. Abaixo, textarea com `maxlength` e o botão "Comentar".

- [ ] TDD: testes primeiro (FAIL), depois o código (PASS).
- [ ] Componente e db. Check e build. Commit `Add comment threads`.

### Task 4: Comentários nas sessões do cardápio
- Modify: `MenuView.svelte`. Em cada `.session`, depois dos itens: `<CommentThread parent={{ kind: "menuSession", id: view.session.id }} {participantId} />`.
- Modify: `MenuAdminSession.svelte` e `MenuAdmin.svelte`. O MenuAdmin precisa receber `participantId` (App passa) e o repassa. Quando a sessão não está recolhida, mostrar `CommentThread` com `admin`.
- [ ] Check, build e commit `Add comments to menu sessions`.

### Task 5: Página Bebidas e admin

**Files:**
- Create: `src/lib/drinks.ts`, `tests/drinks.test.ts`, `src/lib/drinksDb.ts`, `src/lib/components/DrinksView.svelte`, `src/lib/components/DrinksAdmin.svelte`, `src/lib/components/DrinkCard.svelte`

```ts
// drinks.ts
export interface DrinkData { id: string; name: string; description?: string | null; createdAt: number; members: { id: string; name: string }[]; createdBy?: { id: string; name: string } | null }
export function normalizeDrinkName(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
}
export function findDuplicate<T extends DrinkData>(drinks: T[], name: string, exceptId?: string): T | null {
  const n = normalizeDrinkName(name);
  return drinks.find((d) => d.id !== exceptId && normalizeDrinkName(d.name) === n) ?? null;
}
export function sortDrinks<T extends DrinkData>(drinks: T[]): T[] {
  return [...drinks].sort((a, b) => b.members.length - a.members.length || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
```

Testes de `tests/drinks.test.ts`:
- `normalizeDrinkName("  Vódka   Absolut ")` → `"vodka absolut"`.
- `findDuplicate`: acha `" vódka "` vs `"Vodka"`; ignora `exceptId`; null quando não há.
- `sortDrinks`: por membros desc, depois `createdAt` asc, sem mutar a entrada.

`drinksDb.ts`:
- `useDrinksQuery()` → `db.useQuery({ drinks: { members: {}, createdBy: {} } })`.
- `addDrink(participantId, name, description)` cria com `createdAt`, linka `createdBy` e `members` e devolve o id.
- `toggleMember(drink, participantId)` faz link/unlink de `members`.
- `updateDrink(id, { name, description })` e `deleteDrink(id)`. A cascade dos comentários vem do link `drinkComments`.

`DrinkCard.svelte`:
- **Props:** `drink`, `participantId`, `admin` e `editable` (admin).
- **Conteúdo:** nome, descrição e "sugerida por X"; contagem "N no grupo" e chips com os apelidos (o meu destacado).
- **Botão:** "Quero beber" (accent) ou "Estou no grupo ✓ · sair".
- **Comentários:** `CommentThread` com `{ kind: "drink" }`.
- **Admin:** inputs inline de nome e descrição, que salvam no blur (o nome não pode ficar vazio nem duplicado, senão reverte com alert). Botão "Remover bebida" com confirm.

`DrinksView.svelte`:
- Intro: "Sugira o que você quer beber e entre nos grupos das bebidas dos outros — assim sabemos quanto comprar de cada."
- Formulário com nome e descrição opcional. Se houver duplicata, a mensagem "Já existe “X” — entre no grupo dela" com um botão que entra no grupo.
- Lista via `sortDrinks`; estado vazio "Nenhuma bebida sugerida ainda."

`DrinksAdmin.svelte`:
- Título "Admin · Bebidas" e o link "Voltar".
- A mesma lista com os cards `editable` e `admin`.

App: `section === "bebidas"` → `DrinksView` ou `DrinksAdmin`.

- [ ] TDD das regras. Componentes. Check e build. Commit `Add drinks page with groups and admin`.

### Task 6: Docs, E2E, review e deploy
- [ ] README: o login, as páginas (Cardápio, Bebidas, Data encerrada) e as rotas `#/bebidas` e `#/bebidas/admin`. Commit.
- [ ] E2E Playwright contra o app efêmero, cobrindo os fluxos do spec e a Review Focus. O código vem de `generateMagicCode`.
- [ ] Review do branch inteiro (subagente) e correção dos achados Important.
- [ ] Deploy, só depois do OK do usuário:
  1. `bun run instant:push`;
  2. script de limpeza dos participants sem user, conferindo as contagens de `menuSessions`, `menuItems` e `menuSettings` antes e depois;
  3. merge e push.
