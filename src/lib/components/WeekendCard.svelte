<script lang="ts">
  import {
    weekendFromFriday,
    dayLabel,
    dayNumber,
    weekendMonthLabel,
  } from "../dates";
  import {
    castVote,
    removeVote,
    type WeekendWithVotes,
    type ArrivalType,
  } from "../votes";

  interface Props {
    weekend: WeekendWithVotes;
    participantId: string;
    /** 0..1, how this weekend's turnout compares to the busiest one. */
    heatRatio: number;
  }

  let { weekend, participantId, heatRatio }: Props = $props();

  let infoOpen = $state(false);

  const dates = $derived(weekendFromFriday(weekend.fridayDate));

  const fridayVoters = $derived(
    weekend.votes.filter((v) => v.arrivalType === "friday"),
  );
  const saturdayVoters = $derived(
    weekend.votes.filter((v) => v.arrivalType === "saturday"),
  );

  const myVote = $derived(
    weekend.votes.find((v) => v.participant?.id === participantId)
      ?.arrivalType ?? null,
  );

  const cardStyle = $derived(
    `--heat-saturation: ${Math.round(heatRatio * 55)}%; --heat-lightness: ${Math.round(92 - heatRatio * 14)}%;`,
  );

  function vote(arrivalType: ArrivalType) {
    castVote(weekend, participantId, arrivalType);
  }

  function clearMyVote() {
    removeVote(weekend, participantId);
  }
</script>

<article class="card" style={cardStyle}>
  <p class="month">{weekendMonthLabel(dates)}</p>

  <div class="info-wrap">
    <button
      type="button"
      class="info-btn"
      aria-label="Ver quem votou"
      onclick={() => (infoOpen = !infoOpen)}
    >
      ℹ️
    </button>
    {#if infoOpen}
      <button
        type="button"
        class="info-backdrop"
        aria-label="Fechar"
        onclick={() => (infoOpen = false)}
      ></button>
      <div class="info-popover">
        <p class="info-title">Sexta ({fridayVoters.length})</p>
        <p class="info-names">
          {fridayVoters.map((v) => v.participant?.name).join(", ") || "—"}
        </p>
        <p class="info-title">Sábado ({saturdayVoters.length})</p>
        <p class="info-names">
          {saturdayVoters.map((v) => v.participant?.name).join(", ") || "—"}
        </p>
      </div>
    {/if}
  </div>

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
    {fridayVoters.length}
    {fridayVoters.length === 1 ? "pessoa chega" : "pessoas chegam"} sexta
    <br />
    {saturdayVoters.length}
    {saturdayVoters.length === 1 ? "pessoa chega" : "pessoas chegam"} sábado
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
    {#if myVote}
      <button type="button" class="clear-btn" onclick={clearMyVote}
        >Remover meu voto</button
      >
    {/if}
  </div>
</article>

<style>
  .card {
    position: relative;
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

  .info-wrap {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
  }

  .info-btn {
    background: none;
    padding: 0.15rem 0.3rem;
    font-size: 0.95rem;
    line-height: 1;
  }

  .info-backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    border: none;
    padding: 0;
    z-index: 10;
  }

  .info-popover {
    position: absolute;
    top: 1.8rem;
    right: 0;
    z-index: 11;
    width: 12rem;
    background: white;
    border-radius: 0.6rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    padding: 0.6rem 0.7rem;
    text-align: left;
  }

  .info-title {
    margin: 0.3rem 0 0.1rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-muted-strong);
  }

  .info-title:first-child {
    margin-top: 0;
  }

  .info-names {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text);
    line-height: 1.3;
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

  .clear-btn {
    align-self: center;
    background: none;
    color: var(--color-danger);
    font-size: 0.8rem;
    padding: 0.2rem;
  }
</style>
