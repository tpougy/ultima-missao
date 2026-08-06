<script lang="ts">
  import {
    parseISODate,
    addDays,
    sameDay,
    monthLabel,
    WEEKDAY_INITIALS,
  } from "../dates";
  import { heatRatio, type WeekendWithVotes } from "../votes";

  interface Props {
    weekends: WeekendWithVotes[];
  }

  let { weekends }: Props = $props();

  type WingPart = "wing-left" | "wing-mid" | "wing-right";

  interface DayCell {
    date: Date;
    day: number;
    isToday: boolean;
    candidate?: { weekendId: string; ratio: number; part: WingPart };
  }

  interface MonthBlock {
    key: string;
    year: number;
    month: number;
    label: string;
    leadingEmpty: number;
    days: DayCell[];
  }

  const today = new Date();

  const monthBlocks = $derived.by((): MonthBlock[] => {
    if (weekends.length === 0) return [];

    // "year-month" -> "year-month-day" -> candidate info
    const dayIndex = new Map<
      string,
      { weekendId: string; ratio: number; part: WingPart }
    >();
    const monthKeys = new Set<string>();

    for (const weekend of weekends) {
      const friday = parseISODate(weekend.fridayDate);
      const ratio = heatRatio(weekend, weekends);
      const parts: [Date, WingPart][] = [
        [friday, "wing-left"],
        [addDays(friday, 1), "wing-mid"],
        [addDays(friday, 2), "wing-right"],
      ];
      for (const [date, part] of parts) {
        monthKeys.add(`${date.getFullYear()}-${date.getMonth()}`);
        dayIndex.set(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`, {
          weekendId: weekend.id,
          ratio,
          part,
        });
      }
    }

    return [...monthKeys]
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const leadingEmpty = new Date(year, month, 1).getDay();
        const days: DayCell[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          days.push({
            date,
            day,
            isToday: sameDay(date, today),
            candidate: dayIndex.get(`${year}-${month}-${day}`),
          });
        }
        return {
          key,
          year,
          month,
          label: `${monthLabel(new Date(year, month, 1))} ${year}`,
          leadingEmpty,
          days,
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);
  });

  function heatBackground(ratio: number): string {
    const saturation = Math.round(ratio * 55);
    const lightness = Math.max(38, Math.round(92 - ratio * 47));
    return `hsl(142deg ${saturation}% ${lightness}%)`;
  }

  function jumpToWeekend(weekendId: string) {
    const target = document.getElementById(`weekend-${weekendId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("flash");
    setTimeout(() => target.classList.remove("flash"), 900);
  }
</script>

{#if monthBlocks.length > 0}
  <section class="overview">
    <div class="overview-heading">
      <h2>Visão do mês</h2>
      <span>toque num destaque pra ver os detalhes</span>
    </div>

    {#each monthBlocks as month (month.key)}
      <div class="month-block">
        <p class="month-name">{month.label}</p>
        <div class="weekday-row">
          {#each WEEKDAY_INITIALS as label, i (i)}
            <span>{label}</span>
          {/each}
        </div>
        <div class="day-grid">
          {#each { length: month.leadingEmpty } as _, i (i)}
            <div class="day-cell empty"></div>
          {/each}
          {#each month.days as cell (cell.day)}
            {#if cell.candidate}
              <button
                type="button"
                class="day-cell candidate {cell.candidate.part}"
                class:today={cell.isToday}
                style="background: {heatBackground(cell.candidate.ratio)}; color: {cell
                  .candidate.ratio > 0.45 ? '#ffffff' : 'var(--color-text)'};"
                onclick={() => jumpToWeekend(cell.candidate!.weekendId)}
              >
                {cell.day}
              </button>
            {:else}
              <div class="day-cell" class:today={cell.isToday}>
                {cell.day}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}

    <div class="legend">
      <span class="legend-item">
        <span class="legend-swatch plain"></span>sem votos ainda
      </span>
      <span class="legend-item">
        <span class="legend-swatch heat"></span>mais votos = mais verde
      </span>
      <span class="legend-item">
        <span class="legend-swatch today-swatch"></span>hoje
      </span>
    </div>
  </section>
{/if}

<style>
  .overview {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .overview-heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  .overview-heading h2 {
    font-size: 0.9rem;
    margin: 0;
    color: var(--color-muted-strong);
  }

  .overview-heading span {
    font-size: 0.68rem;
    color: var(--color-muted);
    text-align: right;
  }

  .month-block {
    background: var(--color-surface);
    border-radius: 1rem;
    padding: 0.85rem 0.85rem 0.95rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .month-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted-strong);
    margin: 0 0.1rem;
  }

  .weekday-row,
  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.2rem;
  }

  .weekday-row span {
    text-align: center;
    font-size: 0.62rem;
    color: var(--color-muted);
  }

  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    border-radius: 0.4rem;
    color: var(--color-muted);
    border: none;
    background: none;
    font-family: inherit;
    padding: 0;
  }

  .day-cell.empty {
    visibility: hidden;
  }

  .day-cell.today {
    box-shadow: inset 0 0 0 1.5px var(--color-muted-strong);
  }

  .day-cell.candidate {
    font-weight: 700;
    cursor: pointer;
  }

  .day-cell.candidate.wing-left {
    border-top-left-radius: 0.9rem;
    border-bottom-left-radius: 0.9rem;
    box-shadow: inset 0 0 0 1.5px rgba(47, 158, 92, 0.35);
  }

  .day-cell.candidate.wing-right {
    border-top-right-radius: 0.9rem;
    border-bottom-right-radius: 0.9rem;
    box-shadow: inset 0 0 0 1.5px rgba(47, 158, 92, 0.35);
  }

  .day-cell.candidate.wing-mid {
    box-shadow:
      inset 0 1.5px 0 rgba(47, 158, 92, 0.35),
      inset 0 -1.5px 0 rgba(47, 158, 92, 0.35);
  }

  .day-cell.candidate:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    font-size: 0.68rem;
    color: var(--color-muted-strong);
    padding: 0 0.1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-swatch {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 0.2rem;
    flex: none;
  }

  .legend-swatch.plain {
    background: rgba(0, 0, 0, 0.08);
  }

  .legend-swatch.heat {
    background: hsl(142deg 55% 45%);
  }

  .legend-swatch.today-swatch {
    box-shadow: inset 0 0 0 1.5px var(--color-muted-strong);
  }
</style>
