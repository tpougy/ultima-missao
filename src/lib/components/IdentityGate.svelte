<script lang="ts">
  import { db } from "../db";
  import {
    createParticipant,
    setStoredParticipantId,
    NameTakenError,
    type Participant,
  } from "../participants";

  interface Props {
    onIdentified: (participant: Participant) => void;
  }

  let { onIdentified }: Props = $props();

  type Step = "name" | "confirm" | "picker";

  let step = $state<Step>("name");
  let name = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  const participantsQuery = db.useQuery({ participants: {} });
  const participants = $derived(
    ((participantsQuery.data?.participants ?? []) as Participant[])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  );

  function submitName(event: SubmitEvent) {
    event.preventDefault();
    if (name.trim().length === 0) return;
    error = null;
    step = "confirm";
  }

  async function confirmCreate() {
    busy = true;
    error = null;
    try {
      const participant = await createParticipant(name);
      setStoredParticipantId(participant.id);
      onIdentified(participant);
    } catch (err) {
      error =
        err instanceof NameTakenError
          ? err.message
          : "Não foi possível criar o usuário. Tente novamente.";
      step = "name";
    } finally {
      busy = false;
    }
  }

  function selectExisting(participant: Participant) {
    setStoredParticipantId(participant.id);
    onIdentified(participant);
  }
</script>

<div class="gate">
  {#if step === "name"}
    <form class="gate-card" onsubmit={submitName}>
      <h1>Como você se chama?</h1>
      <p class="subtitle">Isso identifica seus votos no grupo.</p>
      <input type="text" placeholder="Seu nome" bind:value={name} autofocus />
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <button type="submit" disabled={name.trim().length === 0}
        >Continuar</button
      >
      {#if participants.length > 0}
        <button type="button" class="link" onclick={() => (step = "picker")}
          >Já tenho um usuário</button
        >
      {/if}
    </form>
  {:else if step === "confirm"}
    <div class="gate-card">
      <h1>Criar novo usuário?</h1>
      <p class="subtitle">
        Você está criando um novo usuário: <strong>{name.trim()}</strong>.
      </p>
      <button type="button" onclick={confirmCreate} disabled={busy}
        >{busy ? "Criando..." : "Confirmar e continuar"}</button
      >
      <button type="button" class="link" onclick={() => (step = "picker")}
        >Já tenho um usuário — escolher da lista</button
      >
      <button
        type="button"
        class="link"
        onclick={() => (step = "name")}
        disabled={busy}>Voltar</button
      >
    </div>
  {:else}
    <div class="gate-card">
      <h1>Escolha seu usuário</h1>
      <p class="subtitle">
        Selecione o nome que você já usou em outro dispositivo.
      </p>
      {#if participants.length === 0}
        <p class="empty">Nenhum usuário cadastrado ainda.</p>
      {:else}
        <ul class="participant-list">
          {#each participants as participant (participant.id)}
            <li>
              <button
                type="button"
                class="participant-btn"
                onclick={() => selectExisting(participant)}
                >{participant.name}</button
              >
            </li>
          {/each}
        </ul>
      {/if}
      <button type="button" class="link" onclick={() => (step = "name")}
        >Voltar</button
      >
    </div>
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

  .participant-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 45vh;
    overflow-y: auto;
  }

  .participant-btn {
    width: 100%;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .empty {
    color: var(--color-muted);
    font-size: 0.9rem;
  }
</style>
