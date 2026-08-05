# Deploy no Cloudflare Pages

## 1. Subir o código pro GitHub

O repo já tem o remote configurado (`tpougy/ultima-missao`). Só falta enviar:

```bash
git push -u origin main
```

## 2. Criar o projeto no Cloudflare Pages

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Autorize o GitHub e selecione o repositório `ultima-missao`.
3. Nas configurações de build:

| Campo | Valor |
|---|---|
| Framework preset | `Vite` |
| Build command | `bun install && bun run build` |
| Build output directory | `dist` |

## 3. Variáveis de ambiente

Em **Settings → Environment variables**, adicione (ambiente **Production** e **Preview**):

| Nome | Valor |
|---|---|
| `VITE_INSTANT_APP_ID` | `df668e8c-9921-4b35-87d1-8e38d6ec3d85` |
| `VITE_APP_PASSWORD` | `missao2026` |
| `VITE_ADMIN_PASSWORD` | `capitao2026` |

Essas variáveis são lidas em **build time** (o Vite embute os valores no bundle), então precisam estar configuradas antes do deploy — se adicionar depois, é preciso re-fazer o deploy (**Retry deployment**) para elas entrarem em vigor.

## 4. Deploy

Clique em **Save and Deploy**. Toda vez que você der `git push` no `main`, o Cloudflare Pages builda e publica automaticamente.

## 5. Configurar o subdomínio

Pré-requisito: o domínio raiz (ex: `seudominio.com`) precisa já estar ativo no Cloudflare (nameservers apontando pra lá).

1. No projeto criado, vá em **Custom domains** → **Set up a custom domain**.
2. Digite o subdomínio desejado, ex: `viagem.seudominio.com`.
3. Se o domínio já estiver no Cloudflare, o registro DNS (`CNAME` apontando pro projeto `*.pages.dev`) é criado automaticamente — clique em **Activate domain**.
4. Aguarde a propagação (geralmente segundos, já que é tudo dentro do Cloudflare) e acesse `https://viagem.seudominio.com`.

Pronto — o site fica disponível tanto em `<projeto>.pages.dev` quanto no subdomínio custom.
