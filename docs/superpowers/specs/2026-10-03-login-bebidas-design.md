# Login por e-mail, página de Bebidas, comentários e encerramento da votação de datas

Data: 2026-10-03 · Status: aprovado por delegação (o usuário pediu execução 100% autônoma)

## O que o usuário pediu

1. **Votação de datas encerrada.** A aba Data mostra só um aviso: a votação
   terminou e as datas são 31/out, 1/nov e 2/nov de 2026.
2. **Login por e-mail (InstantDB magic code)**, obrigatório para todos.
   - A pessoa digita o e-mail, recebe um código e entra.
   - No primeiro login, escolhe um apelido.
   - A tela de login tem um botão "Qual e-mail eu usei?" que lista os
     e-mails já cadastrados (grupo de ~10 pessoas, risco aceito pelo usuário).
   - A senha geral do site continua sendo a primeira etapa, e a senha de
     admin continua igual.
   - Todas as funcionalidades atuais se mantêm.
3. **Página Bebidas (alcoólicos).**
   - Qualquer pessoa sugere um item; não há sessões.
   - Os outros entram no "grupo" daquela bebida. O objetivo é dimensionar
     quem bebe o quê.
   - O admin pode editar ou remover itens.
   - Itens têm comentários.
4. **Comentários nas sessões do cardápio** (não nos itens).

Dos dados atuais, só os **itens e sessões do cardápio** (e as configurações
do cardápio) importam. Votos e participantes antigos são de teste e podem
sair.

## Decisões (tomadas por mim, com o motivo)

### Identidade
- **Uma entidade de pessoa.** `participants` continua sendo a pessoa (votos,
  curtidas, opt-in do cardápio). Um novo link `participantUser` liga
  `participants.user` → `$users`, com "has one" nos dois lados. Assim os
  votos e curtidas existentes continuam funcionando sem migração.
- **Apelido = `participants.name`**, que já é único.
- **Primeiro login (usuário autenticado sem participant):** a tela "Escolha
  seu apelido" cria o participant e o liga ao `$users`. Não há como
  reivindicar participantes antigos, porque os votos não importam.
- **Limpeza no deploy:** um script admin apaga os participants sem `user`
  (os antigos, de teste). Isso libera os apelidos, e as curtidas e votos de
  datas deles vão junto. Itens, sessões e configurações do cardápio não estão
  ligados a participants por cascade e ficam intactos. O script confere as
  contagens antes e depois.
- **"Trocar usuário" vira "Sair"**, que faz `db.auth.signOut()`. O
  `um_participant_id` do localStorage deixa de ser usado. O
  `IdentityGate` (escolha de nome sem login) é removido.
- **Lista de e-mails:** `$users` passa a ter `view: "true"`. A tela de login
  consulta `participants { user }` e mostra "apelido — e-mail".
- **Permissões:** continuam abertas para as entidades do app, como hoje.
  Segurança forte não é objetivo, e o login serve para organizar quem é quem.

### Fluxo de telas (App.svelte)
`PasswordGate (site)` → `LoginGate` (e-mail → código) → `NicknameGate` (se
não houver participant ligado) → (admin: `PasswordGate`) → `NavBar` + página.

### Datas
- A rota `#/data` (e `#/data/admin`) renderiza `DatesClosed.svelte`, um card
  com a mensagem e as três datas fixas.
- `MainView`, `AdminPanel`, `WeekendCard`, `MonthOverview` e `votes.ts`
  são removidos. O git guarda o histórico. As entidades `weekends`/`votes`
  ficam no schema, com os dados intactos.
- A NavBar esconde o link Admin na seção Data.

### Bebidas
- **Entidade `drinks`:** `name`, `description?` e `createdAt` (indexado).
- **Links:**
  - `drinkCreator`: `drinks.createdBy` → participants, um por bebida.
  - `drinkMembers`: `drinks.members` ↔ `participants.drinks`, muitos para
    muitos. Estar no grupo é um link, como as curtidas do cardápio.
- **Sugerir:** nome (obrigatório) e descrição (opcional).
  - Quem sugere entra automaticamente no grupo.
  - Se já existe uma bebida com o mesmo nome (normalizado: trim, sem
    acento, case-insensitive), não cria outra e mostra "Já existe — entre no
    grupo dela".
- **Lista:** ordenada por número de membros (desc) e depois por `createdAt`.
- **Cada card mostra:**
  - nome, descrição e "sugerido por X";
  - quem está no grupo (chips com apelidos) e a contagem;
  - o botão "Quero beber" / "Sair do grupo";
  - os comentários.
- **Admin (`#/bebidas/admin`):** editar nome e descrição, remover a bebida
  (com confirmação) e apagar comentários.
- Não existe opt-in. Qualquer pessoa logada participa.

### Comentários
- **Entidade `comments`:** `text` e `createdAt` (indexado).
- **Links:**
  - `commentAuthor`: comments.author → participants, com cascade.
  - `drinkComments`: comments.drink → drinks, com cascade.
  - `menuSessionComments`: comments.menuSession → menuSessions, com cascade.

  Cada comentário tem exatamente um "pai".
- **Componente `CommentThread.svelte`:** recolhível, com o rótulo
  "Comentários (N)".
  - Mostra a lista em ordem cronológica (autor, data e hora curtas, texto).
  - Tem um campo para comentar.
  - Pode apagar: o autor, os próprios comentários; o admin, qualquer um.
- **Onde aparece:**
  - em cada sessão do `MenuView`;
  - em cada bebida;
  - no `MenuAdminSession` e no admin de bebidas, com `admin` ligado.
- Texto vazio não envia. O limite é de 1000 caracteres.

### Rotas
`Section = "cardapio" | "bebidas" | "data"`. As abas são Cardápio · Bebidas
· Data. Seção desconhecida → cardápio.

## Regras puras (testáveis em `tests/`)
- `src/lib/drinks.ts`:
  - `normalizeDrinkName(name)`;
  - `findDuplicate(drinks, name)`;
  - `sortDrinks(drinks)`.
- `src/lib/comments.ts`:
  - `sortComments`;
  - `canDeleteComment(comment, participantId, admin)`;
  - `validateComment(text)` (devolve o texto aparado ou null);
  - `COMMENT_MAX`.

## Testes
- **Unitários:** `bun test tests/` para as regras novas.
- **`bun run check` e `bun run build`.**
- **E2E com Playwright em um app InstantDB efêmero.** O código de login é
  obtido via admin SDK, com `auth.generateMagicCode`. Fluxos cobertos:
  - senha;
  - login;
  - escolha de apelido (incluindo apelido em uso);
  - lista de e-mails;
  - cardápio continua votando;
  - comentário em sessão;
  - bebidas (sugerir, duplicata, entrar e sair, comentar);
  - admin de bebidas (editar, remover);
  - aba Data encerrada;
  - sair.

## Deploy
Antes do merge, em produção:
1. Rodar `bun run instant:push` (schema + perms). É aditivo: o cliente
   antigo continua funcionando com o schema novo.
2. Rodar o script de limpeza de participants antigos e conferir que as
   contagens de itens e sessões do cardápio não mudaram.

Depois, merge e push na main.
