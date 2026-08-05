<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    check: (password: string) => boolean;
    onUnlocked: () => void;
    onCancel?: () => void;
  }

  let { title, subtitle, check, onUnlocked, onCancel }: Props = $props();

  let password = $state("");
  let error = $state(false);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (check(password)) {
      error = false;
      onUnlocked();
    } else {
      error = true;
    }
  }
</script>

<div class="gate">
  <form class="gate-card" onsubmit={submit}>
    <h1>{title}</h1>
    {#if subtitle}
      <p class="subtitle">{subtitle}</p>
    {/if}
    <input
      type="password"
      placeholder="Senha"
      bind:value={password}
      autofocus
    />
    {#if error}
      <p class="error">Senha incorreta.</p>
    {/if}
    <button type="submit">Entrar</button>
    {#if onCancel}
      <button type="button" class="link" onclick={onCancel}>Voltar</button>
    {/if}
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
    gap: 0.75rem;
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

  .link {
    background: none;
    color: var(--color-muted);
    font-size: 0.85rem;
    padding: 0.25rem;
  }
</style>
