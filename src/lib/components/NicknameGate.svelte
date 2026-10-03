<script lang="ts">
  import { createParticipantForUser, NicknameTakenError } from "../participants";

  interface Props {
    userId: string;
    email: string;
    onSignOut: () => void;
  }

  let { userId, email, onSignOut }: Props = $props();

  let nickname = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (nickname.trim().length === 0) return;
    busy = true;
    error = null;
    try {
      // App.svelte's live participant query picks the new row up.
      await createParticipantForUser(userId, nickname);
    } catch (err) {
      error =
        err instanceof NicknameTakenError
          ? err.message
          : "Não foi possível salvar o apelido. Tente novamente.";
    } finally {
      busy = false;
    }
  }
</script>

<div class="gate">
  <form class="gate-card" onsubmit={submit}>
    <h1>Escolha seu apelido</h1>
    <p class="subtitle">
      É assim que o grupo vai ver seus votos e comentários.
    </p>
    <input
      type="text"
      placeholder="Seu apelido"
      maxlength="40"
      bind:value={nickname}
    />
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <button type="submit" disabled={busy || nickname.trim().length === 0}
      >{busy ? "Salvando..." : "Continuar"}</button
    >
    <p class="who">
      Entrou como {email}.
      <button type="button" class="link" onclick={onSignOut}>Sair</button>
    </p>
  </form>
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

  input {
    text-align: center;
  }

  .error {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin: 0;
  }

  .who {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--color-muted);
    word-break: break-all;
  }

  .link {
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.8rem;
    padding: 0.25rem;
    text-decoration: underline;
  }
</style>
