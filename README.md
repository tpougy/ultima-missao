# Operação Última Missão — Scheduler

App 100% client-side para o grupo escolher o melhor final de semana para a
viagem. Sem backend próprio: [InstantDB](https://instantdb.com) cuida da
persistência e da sincronização em tempo real entre todo mundo.

Stack: Svelte 5 (runes) + Vite + TypeScript + Bun + InstantDB.

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
- `VITE_ADMIN_PASSWORD` — senha da área de admin (cria/edita/remove finais de
  semana).
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
