<script lang="ts">
  import { db, id } from "../db";
  import { toISODate } from "../dates";
  import type { WeekendWithVotes } from "../votes";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const query = db.useQuery({
    weekends: {
      votes: {},
      $: { order: { order: "asc" } },
    },
  });

  const weekends = $derived(
    (query.data?.weekends ?? []) as WeekendWithVotes[],
  );

  const nextOrder = $derived(
    weekends.length === 0 ? 0 : Math.max(...weekends.map((w) => w.order)) + 1,
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
      db.tx.weekends[id()].update({
        fridayDate: newFridayDate,
        order: nextOrder,
      }),
    );
    newFridayDate = defaultNextFriday();
  }

  function updateFridayDate(weekend: WeekendWithVotes, value: string) {
    if (!value) return;
    db.transact(db.tx.weekends[weekend.id].update({ fridayDate: value }));
  }

  function updateOrder(weekend: WeekendWithVotes, value: string) {
    const order = Number(value);
    if (Number.isNaN(order)) return;
    db.transact(db.tx.weekends[weekend.id].update({ order }));
  }

  function removeWeekend(weekend: WeekendWithVotes) {
    if (!confirm("Remover este final de semana e todos os votos dele?")) {
      return;
    }
    db.transact(db.tx.weekends[weekend.id].delete());
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
            <input
              type="number"
              class="order-input"
              value={weekend.order}
              onchange={(e) => updateOrder(weekend, e.currentTarget.value)}
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
                .map((v) => v.participantName)
                .join(", ") || "—"}
              <br />
              Sábado: {weekend.votes
                .filter((v) => v.arrivalType === "saturday")
                .map((v) => v.participantName)
                .join(", ") || "—"}
            </p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
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

  .order-input {
    width: 3.5rem;
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
</style>
