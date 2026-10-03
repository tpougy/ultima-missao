<script lang="ts">
  import { CalendarCheck } from "lucide-svelte";

  /** The dates the group voted for; voting is over (see the spec of 2026-10-03). */
  const days = [
    { number: 31, weekday: "Sábado", month: "outubro" },
    { number: 1, weekday: "Domingo", month: "novembro" },
    { number: 2, weekday: "Segunda", month: "novembro" },
  ];
</script>

<main class="closed">
  <section class="card">
    <CalendarCheck size={32} color="var(--color-accent)" />
    <h1>Votação de datas encerrada</h1>
    <p class="subtitle">As datas escolhidas pelo grupo foram:</p>
    <ul>
      {#each days as day (day.number)}
        <li>
          <span class="day">{day.number}</span>
          <span class="labels">
            <span class="weekday">{day.weekday}</span>
            <span class="month">{day.month}</span>
          </span>
        </li>
      {/each}
    </ul>
    <p class="year">2026</p>
  </section>
</main>

<style>
  .closed {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  .card {
    background: var(--color-surface);
    border-radius: 1rem;
    padding: 1.5rem 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  h1 {
    font-size: 1.2rem;
    margin: 0.25rem 0 0;
  }

  .subtitle {
    margin: 0;
    color: var(--color-muted-strong);
    font-size: 0.9rem;
  }

  ul {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    display: flex;
    gap: 1.25rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .day {
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1;
  }

  .labels {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .weekday {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .month {
    font-size: 0.75rem;
    color: var(--color-muted-strong);
  }

  .year {
    margin: 0;
    font-weight: 600;
    color: var(--color-muted-strong);
  }
</style>
