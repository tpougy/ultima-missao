<script lang="ts">
  import { Check, Trash2 } from "lucide-svelte";
  import CommentThread from "./CommentThread.svelte";
  import { findDuplicate, type DrinkData } from "../drinks";
  import { deleteDrink, toggleMember, updateDrink } from "../drinksDb";

  interface Props {
    drink: DrinkData;
    /** All drinks, to reject renaming onto an existing name. */
    drinks: DrinkData[];
    participantId: string;
    /** Admin page: inline editing, removal and deleting any comment. */
    admin?: boolean;
  }

  let { drink, drinks, participantId, admin = false }: Props = $props();

  const isMember = $derived(drink.members.some((p) => p.id === participantId));
  const members = $derived(
    [...drink.members].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  );

  function rename(input: HTMLInputElement) {
    const name = input.value.trim();
    if (name === drink.name) return;
    if (!name) {
      input.value = drink.name;
      return;
    }
    const duplicate = findDuplicate(drinks, name, drink.id);
    if (duplicate) {
      alert(`Já existe uma bebida chamada "${duplicate.name}".`);
      input.value = drink.name;
      return;
    }
    updateDrink(drink.id, { name });
  }

  function changeDescription(input: HTMLTextAreaElement) {
    const description = input.value.trim();
    if (description !== (drink.description ?? "")) {
      updateDrink(drink.id, { description });
    }
  }

  function remove() {
    if (confirm(`Remover "${drink.name}" e todos os seus comentários?`)) {
      deleteDrink(drink.id);
    }
  }
</script>

<article class="drink" class:member={isMember}>
  {#if admin}
    <div class="edit">
      <input
        type="text"
        aria-label="Nome da bebida"
        value={drink.name}
        onchange={(e) => rename(e.currentTarget)}
      />
      <textarea
        rows="2"
        aria-label="Descrição da bebida"
        placeholder="Descrição (opcional)"
        value={drink.description ?? ""}
        onchange={(e) => changeDescription(e.currentTarget)}
      ></textarea>
    </div>
  {:else}
    <h3>{drink.name}</h3>
    {#if drink.description}
      <p class="description">{drink.description}</p>
    {/if}
  {/if}

  {#if drink.createdBy}
    <p class="by">Sugerida por {drink.createdBy.name}</p>
  {/if}

  <div class="group">
    <span class="count"
      >{drink.members.length}
      {drink.members.length === 1 ? "pessoa" : "pessoas"} no grupo</span
    >
    {#if members.length > 0}
      <ul class="members">
        {#each members as person (person.id)}
          <li class:me={person.id === participantId}>{person.name}</li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="actions">
    {#if isMember}
      <span class="joined"><Check size={16} /> Você está no grupo</span>
      <button
        type="button"
        class="leave"
        onclick={() => toggleMember(drink, participantId)}>Sair do grupo</button
      >
    {:else}
      <button type="button" onclick={() => toggleMember(drink, participantId)}
        >Quero beber</button
      >
    {/if}
    {#if admin}
      <button type="button" class="remove" onclick={remove}>
        <Trash2 size={15} /> Remover
      </button>
    {/if}
  </div>

  <CommentThread parent={{ kind: "drink", id: drink.id }} {participantId} {admin} />
</article>

<style>
  .drink {
    background: var(--color-surface);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    border-left: 4px solid transparent;
  }

  .drink.member {
    border-left-color: var(--color-accent);
  }

  h3 {
    margin: 0;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }

  .description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-muted-strong);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .by {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .edit {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .edit input {
    font-weight: 600;
  }

  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.875rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    padding: 0.5rem 0.7rem;
    resize: vertical;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .count {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-muted-strong);
  }

  .members {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .members li {
    font-size: 0.75rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
  }

  .members li.me {
    background: var(--color-accent);
    color: white;
  }

  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .actions button {
    font-size: 0.875rem;
    padding: 0.5rem 0.9rem;
  }

  .joined {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-accent);
  }

  .leave {
    background: none;
    color: var(--color-muted-strong);
    text-decoration: underline;
    padding: 0.25rem;
  }

  .remove {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    color: var(--color-danger);
  }
</style>
