<script lang="ts">
  import {
    weekendFromFriday,
    dayLabel,
    dayNumber,
    weekendMonthLabel,
  } from "../dates";
  import { castVote, type WeekendWithVotes, type ArrivalType } from "../votes";

  interface Props {
    weekend: WeekendWithVotes;
    participantId: string;
    participantName: string;
    /** 0..1, how this weekend's turnout compares to the busiest one. */
    heatRatio: number;
  }

  let { weekend, participantId, participantName, heatRatio }: Props =
    $props();

  const dates = $derived(weekendFromFriday(weekend.fridayDate));

  const fridayCount = $derived(
    weekend.votes.filter((v) => v.arrivalType === "friday").length,
  );
  const saturdayCount = $derived(
    weekend.votes.filter((v) => v.arrivalType === "saturday").length,
  );

  const myVote = $derived(
    weekend.votes.find((v) => v.participantId === participantId)
      ?.arrivalType ?? null,
  );

  const cardStyle = $derived(
    `--heat-saturation: ${Math.round(heatRatio * 55)}%; --heat-lightness: ${Math.round(92 - heatRatio * 14)}%;`,
  );

  function vote(arrivalType: ArrivalType) {
    castVote(weekend, participantId, participantName, arrivalType);
  }
</script>

<article class="card" style={cardStyle}>
  <p class="month">{weekendMonthLabel(dates)}</p>
  <header class="dates">
    <div class="date-col">
      <span class="weekday">{dayLabel(dates.friday)}</span>
      <span class="day">{dayNumber(dates.friday)}</span>
    </div>
    <div class="date-col">
      <span class="weekday">{dayLabel(dates.saturday)}</span>
      <span class="day">{dayNumber(dates.saturday)}</span>
    </div>
    <div class="date-col">
      <span class="weekday">{dayLabel(dates.sunday)}</span>
      <span class="day">{dayNumber(dates.sunday)}</span>
    </div>
  </header>

  <div class="bar-track">
    <div class="bar-fill" style="width: {heatRatio * 100}%"></div>
  </div>

  <p class="summary">
    {fridayCount} {fridayCount === 1 ? "pessoa chega" : "pessoas chegam"} sexta
    <br />
    {saturdayCount} {saturdayCount === 1 ? "pessoa chega" : "pessoas chegam"} sábado
  </p>

  <div class="vote-buttons">
    <button
      type="button"
      class="vote-btn"
      class:selected={myVote === "friday"}
      onclick={() => vote("friday")}
    >
      ✅ Consigo chegar na sexta à tarde/noite
    </button>
    <button
      type="button"
      class="vote-btn"
      class:selected={myVote === "saturday"}
      onclick={() => vote("saturday")}
    >
      🟡 Só consigo chegar no sábado
    </button>
  </div>
</article>

<style>
  .card {
    background: hsl(142deg var(--heat-saturation) var(--heat-lightness));
    border-radius: 1rem;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .month {
    margin: 0;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--color-muted-strong);
  }

  .dates {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }

  .date-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .weekday {
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--color-muted);
  }

  .day {
    font-size: 1.4rem;
    font-weight: 600;
  }

  .bar-track {
    height: 0.4rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 999px;
    transition: width 0.2s ease;
  }

  .summary {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-muted-strong);
    line-height: 1.4;
  }

  .vote-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .vote-btn {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: var(--color-text);
    font-size: 0.9rem;
    padding: 0.6rem 0.75rem;
    text-align: left;
  }

  .vote-btn.selected {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    font-weight: 600;
  }
</style>
