<script lang="ts">
  import { db } from "../db";

  type Step = "email" | "code";

  let step = $state<Step>("email");
  let email = $state("");
  let code = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);
  let showEmails = $state(false);

  // Small group (~10 people): listing the emails already used is accepted,
  // so people who forgot which address they used can find it.
  const usersQuery = db.useQuery({ participants: { user: {} } });
  const knownEmails = $derived(
    (usersQuery.data?.participants ?? [])
      .flatMap((p) => (p.user?.email ? [{ name: p.name, email: p.user.email }] : []))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  );

  async function sendCode(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    busy = true;
    error = null;
    try {
      await db.auth.sendMagicCode({ email: trimmed });
      email = trimmed;
      code = "";
      step = "code";
    } catch {
      error = "Não foi possível enviar o código. Confira o e-mail e tente de novo.";
    } finally {
      busy = false;
    }
  }

  async function verifyCode(event: SubmitEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    busy = true;
    error = null;
    try {
      // On success useAuth() in App.svelte picks up the user.
      await db.auth.signInWithMagicCode({ email, code: code.trim() });
    } catch {
      error = "Código inválido ou expirado.";
    } finally {
      busy = false;
    }
  }

  function pickEmail(value: string) {
    email = value;
    showEmails = false;
  }
</script>

<div class="gate">
  {#if step === "email"}
    <form class="gate-card" onsubmit={sendCode}>
      <h1>Entrar</h1>
      <p class="subtitle">Digite seu e-mail para receber um código de acesso.</p>
      <input
        type="email"
        placeholder="seu@email.com"
        autocomplete="email"
        bind:value={email}
      />
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <button type="submit" disabled={busy || email.trim().length === 0}
        >{busy ? "Enviando..." : "Enviar código"}</button
      >
      <button
        type="button"
        class="link"
        aria-expanded={showEmails}
        onclick={() => (showEmails = !showEmails)}>Qual e-mail eu usei?</button
      >
      {#if showEmails}
        {#if knownEmails.length === 0}
          <p class="empty">Ninguém entrou com e-mail ainda.</p>
        {:else}
          <ul class="emails">
            {#each knownEmails as known (known.email)}
              <li>
                <button type="button" class="email-btn" onclick={() => pickEmail(known.email)}>
                  <strong>{known.name}</strong>
                  <span>{known.email}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </form>
  {:else}
    <form class="gate-card" onsubmit={verifyCode}>
      <h1>Digite o código</h1>
      <p class="subtitle">
        Enviamos um código para <strong>{email}</strong>. Confira também o spam.
      </p>
      <input
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        placeholder="123456"
        bind:value={code}
      />
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <button type="submit" disabled={busy || code.trim().length === 0}
        >{busy ? "Entrando..." : "Entrar"}</button
      >
      <button
        type="button"
        class="link"
        disabled={busy}
        onclick={() => {
          step = "email";
          error = null;
        }}>Usar outro e-mail</button
      >
    </form>
  {/if}
</div>

<style>
  .gate {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .gate-card {
    width: 100%;
    max-width: 22rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    text-align: center;
  }

  h1 {
    font-size: 1.25rem;
    margin: 0 0 0.25rem;
  }

  .subtitle {
    margin: 0 0 0.5rem;
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  .subtitle strong {
    color: var(--color-text);
    word-break: break-all;
  }

  input {
    text-align: center;
  }

  .error {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin: 0;
  }

  .link {
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.85rem;
    padding: 0.25rem;
  }

  .emails {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 40vh;
    overflow-y: auto;
  }

  .email-btn {
    width: 100%;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-weight: 400;
  }

  .email-btn span {
    font-size: 0.8rem;
    color: var(--color-muted-strong);
    word-break: break-all;
  }

  .empty {
    color: var(--color-muted);
    font-size: 0.9rem;
    margin: 0;
  }
</style>
