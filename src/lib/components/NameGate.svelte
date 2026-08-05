<script lang="ts">
  interface Props {
    onSubmit: (name: string) => void;
  }

  let { onSubmit }: Props = $props();

  let name = $state("");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  }
</script>

<div class="gate">
  <form class="gate-card" onsubmit={submit}>
    <h1>Como você se chama?</h1>
    <p class="subtitle">Usamos isso para saber quem já votou.</p>
    <input type="text" placeholder="Seu nome" bind:value={name} autofocus />
    <button type="submit" disabled={name.trim().length === 0}>Continuar</button>
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
</style>
