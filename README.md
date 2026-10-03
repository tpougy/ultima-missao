# Operação Última Missão — Scheduler

App 100% client-side para o grupo organizar a viagem: votar no cardápio,
combinar as bebidas e conferir as datas (já definidas). Sem backend próprio: [InstantDB](https://instantdb.com) cuida da
persistência e da sincronização em tempo real entre todo mundo.

Stack: Svelte 5 (runes) + Vite + TypeScript + Bun + InstantDB.

## Acesso

1. Senha do site (`VITE_APP_PASSWORD`), lembrada no navegador.
2. Login por e-mail do InstantDB: a pessoa recebe um código de 6 dígitos.
   Na tela de login, "Qual e-mail eu usei?" lista os e-mails já cadastrados.
3. No primeiro login, escolhe um apelido (único), que é o nome mostrado nos
   votos, grupos e comentários.

"Sair" encerra a sessão do InstantDB, mas mantém a senha do site.

## Páginas

Rotas via hash (funciona em hospedagem estática sem rewrites):

- `#/cardapio` (default) — votação do cardápio. Na primeira visita a pessoa
  escolhe se participa da votação. Um item entra no cardápio quando pelo
  menos 50% dos votantes votam nele; o topo mostra custo por pessoa (total ÷
  pagantes) e o total.
- `#/cardapio/admin` — pagantes, período da viagem, sessões (por dia ou no
  card "Geral") e itens.
- `#/bebidas` — qualquer pessoa sugere uma bebida e entra (ou sai) do grupo
  das bebidas dos outros, para dimensionar quem bebe o quê.
- `#/bebidas/admin` — editar nome e descrição ou remover bebidas.
- `#/data` — votação encerrada; mostra as datas escolhidas (31/out, 1 e
  2/nov de 2026).

Bebidas e sessões do cardápio têm comentários. Cada um apaga os próprios, e o
admin apaga qualquer um.

As regras ficam em funções puras (`src/lib/menu.ts`, `drinks.ts` e
`comments.ts`) e têm testes:

```bash
bun test tests/
```

## Rodando localmente

```bash
bun install
bun run dev
```

## Variáveis de ambiente

Veja `.env.example`. Copie para `.env` e preencha:

- `VITE_INSTANT_APP_ID` — id do app no InstantDB (público, vai no bundle do
  cliente).
- `VITE_APP_PASSWORD` — senha de entrada do app (só evita bots/curiosos, não
  é segurança real).
- `VITE_ADMIN_PASSWORD` — senha das áreas de admin (cardápio e bebidas).
- `INSTANT_APP_ADMIN_TOKEN` — usado só pelo `instant-cli` (schema/perms), não
  entra no bundle do cliente.

## Schema do InstantDB

Editar `instant.schema.ts` / `instant.perms.ts` e então:

```bash
bun run instant:push   # envia schema + perms para o InstantDB
bun run instant:pull   # traz o estado atual do InstantDB para os arquivos locais
```

## Build

```bash
bun run build   # gera dist/, pronto para hospedar como site estático
bun run preview # serve o build localmente
```
