<script lang="ts">
  import { db, id } from "../db";
  import { toISODate } from "../dates";
  import { resetWeekendVotes, type WeekendWithVotes } from "../votes";
  import type { InstaQLEntity } from "@instantdb/svelte";
  import type { AppSchema } from "../../../instant.schema";

  type ParticipantWithVotes = InstaQLEntity<
    AppSchema,
    "participants",
    { votes: object }
  >;

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const query = db.useQuery({
    weekends: {
      votes: { participant: {} },
      $: { order: { fridayDate: "asc" } },
    },
    participants: {
      votes: {},
    },
  });

  const weekends = $derived(
    (query.data?.weekends ?? []) as WeekendWithVotes[],
  );

  const participants = $derived(
    ((query.data?.participants ?? []) as ParticipantWithVotes[])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  );

  let newFridayDate = $state(defaultNextFriday());

  function defaultNextFriday(): string {
    const today = new Date();
    const day = today.getDay(); // 0=Sun..6=Sat
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntilFriday);
    return toISODate(next);
  }

  function addWeekend(event: SubmitEvent) {
    event.preventDefault();
    if (!newFridayDate) return;
    db.transact(
      db.tx.weekends[id()].update({ fridayDate: newFridayDate }),
    );
    newFridayDate = defaultNextFriday();
  }

  function updateFridayDate(weekend: WeekendWithVotes, value: string) {
    if (!value) return;
    db.transact(db.tx.weekends[weekend.id].update({ fridayDate: value }));
  }

  function removeWeekend(weekend: WeekendWithVotes) {
    if (!confirm("Remover este final de semana e todos os votos dele?")) {
      return;
    }
    db.transact(db.tx.weekends[weekend.id].delete());
  }

  function handleResetVotes(weekend: WeekendWithVotes) {
    if (weekend.votes.length === 0) return;
    if (!confirm("Resetar todos os votos deste final de semana?")) return;
    resetWeekendVotes(weekend);
  }

  function removeParticipant(participant: ParticipantWithVotes) {
    const warning =
      participant.votes.length > 0
        ? `Remover "${participant.name}" e ${participant.votes.length} voto(s) dele(a)?`
        : `Remover "${participant.name}"?`;
    if (!confirm(warning)) return;
    // Cascade delete on the participant<->votes link takes care of their votes.
    db.transact(db.tx.participants[participant.id].delete());
  }
</script>

<div class="page">
  <header class="topbar">
    <h1>Admin</h1>
    <button type="button" class="link" onclick={onClose}>Fechar</button>
  </header>

  <form class="add-form" onsubmit={addWeekend}>
    <label>
      Sexta-feira
      <input type="date" bind:value={newFridayDate} required />
    </label>
    <button type="submit">Adicionar</button>
  </form>

  {#if weekends.length === 0}
    <p class="empty">Nenhum final de semana cadastrado ainda.</p>
  {:else}
    <ul class="list">
      {#each weekends as weekend (weekend.id)}
        <li class="row-group">
          <div class="row">
            <input
              type="date"
              value={weekend.fridayDate}
              onchange={(e) =>
                updateFridayDate(weekend, e.currentTarget.value)}
            />
            <span class="vote-count">{weekend.votes.length} votos</span>
            <button
              type="button"
              class="danger"
              onclick={() => removeWeekend(weekend)}>Remover</button
            >
          </div>
          {#if weekend.votes.length > 0}
            <p class="attendees">
              Sexta: {weekend.votes
                .filter((v) => v.arrivalType === "friday")
                .map((v) => v.participant?.name)
                .join(", ") || "—"}
              <br />
              Sábado: {weekend.votes
                .filter((v) => v.arrivalType === "saturday")
                .map((v) => v.participant?.name)
                .join(", ") || "—"}
            </p>
            <button
              type="button"
              class="reset-btn"
              onclick={() => handleResetVotes(weekend)}
              >Resetar votos</button
            >
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <section class="users-section">
    <h2>Usuários</h2>
    {#if participants.length === 0}
      <p class="empty">Nenhum usuário cadastrado ainda.</p>
    {:else}
      <ul class="list">
        {#each participants as participant (participant.id)}
          <li class="row-group">
            <div class="row">
              <span class="participant-name">{participant.name}</span>
              <span class="vote-count"
                >{participant.votes.length} voto{participant.votes.length ===
                1
                  ? ""
                  : "s"}</span
              >
              <button
                type="button"
                class="danger"
                onclick={() => removeParticipant(participant)}
                >Remover</button
              >
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .page {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

  .users-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .users-section h2 {
    font-size: 0.9rem;
    margin: 0;
    color: var(--color-muted-strong);
  }

  .participant-name {
    flex: 1;
    font-size: 0.9rem;
  }

  .add-form {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .add-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--color-muted-strong);
    flex: 1;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .row-group {
    background: var(--color-surface);
    border-radius: 0.75rem;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .attendees {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted);
    line-height: 1.4;
  }

  .row input[type="date"] {
    flex: 1;
    min-width: 0;
  }

  .vote-count {
    font-size: 0.75rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .empty {
    text-align: center;
    color: var(--color-muted);
  }

  .danger {
    background: none;
    color: var(--color-danger);
    font-size: 0.8rem;
    padding: 0.25rem 0.4rem;
  }

  .reset-btn {
    align-self: flex-start;
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.75rem;
    padding: 0.2rem 0;
    text-decoration: underline;
  }
</style>
