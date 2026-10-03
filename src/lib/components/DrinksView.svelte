<script lang="ts">
  import DrinkCard from "./DrinkCard.svelte";
  import { findDuplicate, sortDrinks, type DrinkData } from "../drinks";
  import { addDrink, toggleMember, useDrinksQuery } from "../drinksDb";

  interface Props {
    participantId: string;
    /** Admin page (#/bebidas/admin): edit and remove anyone's drinks. */
    admin?: boolean;
    onClose?: () => void;
  }

  let { participantId, admin = false, onClose }: Props = $props();

  const query = useDrinksQuery();
  const drinks = $derived<DrinkData[]>(sortDrinks(query.data?.drinks ?? []));

  let name = $state("");
  let description = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  /** Set when the typed name matches an existing drink. */
  let duplicate = $state<DrinkData | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return;
    error = null;
    duplicate = findDuplicate(drinks, trimmed);
    if (duplicate) return;
    busy = true;
    try {
      await addDrink(participantId, trimmed, description.trim());
      name = "";
      description = "";
    } catch {
      error = "Não foi possível sugerir. Tente de novo.";
    } finally {
      busy = false;
    }
  }

  function joinDuplicate() {
    if (!duplicate) return;
    if (!duplicate.members.some((p) => p.id === participantId)) {
      toggleMember(duplicate, participantId);
    }
    duplicate = null;
    name = "";
    description = "";
  }
</script>

<div class="page">
  {#if admin}
    <header class="topbar">
      <h1>Admin das bebidas</h1>
      <button type="button" class="link" onclick={onClose}>Fechar</button>
    </header>
  {:else}
    <p class="intro">
      Sugira o que você quer beber e entre nos grupos das bebidas dos outros —
      assim sabemos quanto comprar de cada.
    </p>
  {/if}

  <form class="suggest" onsubmit={submit}>
    <input
      type="text"
      placeholder="Sugerir bebida (ex.: Vodka)"
      maxlength="60"
      bind:value={name}
      oninput={() => (duplicate = null)}
    />
    <textarea
      rows="2"
      maxlength="300"
      placeholder="Detalhes (opcional, ex.: marca, com energético)"
      bind:value={description}
    ></textarea>
    {#if duplicate}
      <div class="duplicate">
        <span>Já existe “{duplicate.name}”.</span>
        {#if duplicate.members.some((p) => p.id === participantId)}
          <span>Você já está no grupo dela.</span>
        {:else}
          <button type="button" onclick={joinDuplicate}>Entrar no grupo dela</button>
        {/if}
      </div>
    {/if}
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <button type="submit" disabled={busy || name.trim().length === 0}
      >{busy ? "Enviando..." : "Sugerir"}</button
    >
  </form>

  {#if query.isLoading}
    <p class="empty">Carregando...</p>
  {:else if drinks.length === 0}
    <p class="empty">Nenhuma bebida sugerida ainda.</p>
  {:else}
    {#each drinks as drink (drink.id)}
      <DrinkCard {drink} {drinks} {participantId} {admin} />
    {/each}
  {/if}
</div>

<style>
  .page {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .topbar h1 {
    font-size: 1.1rem;
    margin: 0;
  }

  .link {
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.85rem;
    padding: 0.25rem;
    text-decoration: underline;
  }

  .intro {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-strong);
  }

  .suggest {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.9rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    padding: 0.6rem 0.85rem;
    resize: vertical;
  }

  .duplicate {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.875rem;
    background: rgba(47, 158, 92, 0.08);
    border-radius: 0.6rem;
    padding: 0.5rem 0.7rem;
  }

  .duplicate button {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }

  .error {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin: 0;
  }

  .empty {
    color: var(--color-muted);
    text-align: center;
  }
</style>
