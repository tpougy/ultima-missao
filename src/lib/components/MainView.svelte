<script lang="ts">
  import { db } from "../db";
  import WeekendCard from "./WeekendCard.svelte";
  import MonthOverview from "./MonthOverview.svelte";
  import { heatRatio, type WeekendWithVotes } from "../votes";

  interface Props {
    participantId: string;
    participantName: string;
    onChangeName: () => void;
    onOpenAdmin: () => void;
  }

  let { participantId, participantName, onChangeName, onOpenAdmin }: Props =
    $props();

  const query = db.useQuery({
    weekends: {
      votes: { participant: {} },
      $: { order: { fridayDate: "asc" } },
    },
  });

  const weekends = $derived(
    (query.data?.weekends ?? []) as WeekendWithVotes[],
  );
</script>

<div class="page">
  <header class="topbar">
    <div class="who">
      Olá, <strong>{participantName}</strong>
      <button type="button" class="link" onclick={onChangeName}
        >Trocar usuário</button
      >
    </div>
    <button type="button" class="link" onclick={onOpenAdmin}>Admin</button>
  </header>

  <div class="hero">
    <p class="hero-eyebrow">Última Missão: Leo</p>
    <p class="hero-subtitle">
      Avante, recrutas! Antes da missão, tem a pré-missão: bater o martelo na
      data certa.
    </p>
    <h1 class="title">Qual final de semana funciona pra você?</h1>
  </div>

  {#if query.isLoading}
    <p class="empty">Carregando...</p>
  {:else if weekends.length === 0}
    <p class="empty">
      Nenhum final de semana cadastrado ainda. Peça para o admin adicionar
      algumas datas.
    </p>
  {:else}
    <MonthOverview {weekends} />
    <div class="grid">
      {#each weekends as weekend (weekend.id)}
        <WeekendCard
          {weekend}
          {participantId}
          heatRatio={heatRatio(weekend, weekends)}
        />
      {/each}
    </div>
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
    font-size: 0.85rem;
    color: var(--color-muted-strong);
  }

  .who {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .hero {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: center;
  }

  .hero-eyebrow {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .hero-subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-strong);
    line-height: 1.5;
  }

  .title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.5rem 0 0;
    text-align: center;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .empty {
    text-align: center;
    color: var(--color-muted);
  }

  @media (min-width: 640px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
