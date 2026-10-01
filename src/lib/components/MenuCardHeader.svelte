<script lang="ts">
  import { parseISODate, dayLabel, dayNumber, monthLabel } from "../dates";

  interface Props {
    /** ISO trip day, or null for the "Geral" card. */
    date: string | null;
  }

  let { date }: Props = $props();

  const parsed = $derived(date ? parseISODate(date) : null);
</script>

<header class="card-header">
  {#if parsed}
    <span class="day">{dayNumber(parsed)}</span>
    <span class="labels">
      <span class="weekday">{dayLabel(parsed)}</span>
      <span class="month">{monthLabel(parsed)}</span>
    </span>
  {:else}
    <span class="labels">
      <span class="general">Geral</span>
      <span class="month">vale para a viagem toda</span>
    </span>
  {/if}
</header>

<style>
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .day {
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1;
  }

  .labels {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .weekday {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--color-accent);
  }

  .general {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .month {
    font-size: 0.75rem;
    color: var(--color-muted-strong);
  }
</style>
