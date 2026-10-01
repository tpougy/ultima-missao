<script lang="ts">
  import MenuCardHeader from "./MenuCardHeader.svelte";
  import MenuItemRow from "./MenuItemRow.svelte";
  import { formatBRL, perPerson } from "../menu";
  import {
    useMenuQuery,
    readMenu,
    setMenuVoter,
    toggleLike,
  } from "../menuDb";

  interface Props {
    participantId: string;
  }

  let { participantId }: Props = $props();

  const query = useMenuQuery();
  const menu = $derived(readMenu(query.data));

  const me = $derived(menu.participants.find((p) => p.id === participantId));
  const isVoter = $derived(me?.menuVoter === true);
  const needsOptIn = $derived(!!me && me.menuVoter == null);

  const voterCount = $derived(menu.state.voters.length);
  const payingCount = $derived(menu.settings?.payingCount ?? null);
  const each = $derived(perPerson(menu.state.total, payingCount));
  const visibleCards = $derived(
    menu.state.cards.filter((card) => card.sessions.length > 0),
  );

  function join() {
    setMenuVoter(participantId, true);
  }

  function watchOnly() {
    setMenuVoter(participantId, false);
  }

  function leave() {
    if (
      !confirm(
        "Sair da votação do cardápio? Seus votos ficam guardados, mas deixam de contar até você voltar.",
      )
    ) {
      return;
    }
    setMenuVoter(participantId, false);
  }
</script>

{#if query.isLoading}
  <p class="empty page">Carregando...</p>
{:else if needsOptIn}
  <div class="optin">
    <div class="optin-card">
      <p class="eyebrow">Cardápio da missão</p>
      <h1>Quer votar no cardápio?</h1>
      <p class="subtitle">
        Quem participa decide o que entra: um item vai pro cardápio quando pelo
        menos metade dos votantes quer ele. Se preferir, é só acompanhar e
        confiar nas escolhas do grupo.
      </p>
      <button type="button" onclick={join}
        >Quero participar da votação do cardápio</button
      >
      <button type="button" class="secondary" onclick={watchOnly}
        >Só quero acompanhar</button
      >
    </div>
  </div>
{:else}
  <div class="page">
    <div class="totals">
      <p class="totals-label">Alimentação por pessoa</p>
      <p class="per-person">{each === null ? "—" : formatBRL(each)}</p>
      <p class="total">Total {formatBRL(menu.state.total)}</p>
      <p class="meta">
        {voterCount}
        {voterCount === 1 ? "votante" : "votantes"} ·
        {payingCount ?? "—"}
        {payingCount === 1 ? "pagante" : "pagantes"}
      </p>
    </div>

    <div class="status">
      {#if isVoter}
        <span>Toque nos itens que você quer. Entra com ≥ 50% dos votos.</span>
        <button type="button" class="link" onclick={leave}
          >Sair da votação</button
        >
      {:else}
        <span>Você está só acompanhando.</span>
        <button type="button" class="link" onclick={join}>Participar</button>
      {/if}
    </div>

    {#if visibleCards.length === 0}
      <p class="empty">
        O cardápio ainda não foi montado. Peça para o admin cadastrar as
        sessões e os itens.
      </p>
    {:else}
      {#each visibleCards as card (card.key)}
        <section class="day-card">
          <MenuCardHeader date={card.date} />
          {#each card.sessions as view (view.session.id)}
            <div class="session">
              <h3>{view.session.name}</h3>
              {#if view.items.length === 0}
                <p class="empty-session">Nenhum item ainda.</p>
              {:else}
                <ul class="items">
                  {#each view.items as scored (scored.item.id)}
                    <MenuItemRow
                      {scored}
                      {voterCount}
                      liked={scored.item.likedBy.some(
                        (p) => p.id === participantId,
                      )}
                      canVote={isVoter}
                      onToggle={() => toggleLike(scored.item, participantId)}
                    />
                  {/each}
                </ul>
              {/if}
            </div>
          {/each}
        </section>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .page {
    max-width: 32rem;
    margin: 0 auto;
    padding: 0 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .totals {
    position: sticky;
    top: 0;
    z-index: 5;
    margin: 0 -1rem;
    padding: 0.9rem 1rem 0.75rem;
    background: var(--color-bg);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    text-align: center;
  }

  .totals p {
    margin: 0;
  }

  .totals-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted-strong);
  }

  .per-person {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1.15;
  }

  .total {
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .meta {
    margin-top: 0.2rem !important;
    font-size: 0.7rem;
    color: var(--color-muted);
  }

  .status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--color-muted-strong);
  }

  .link {
    flex: none;
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.8rem;
    padding: 0.25rem;
    text-decoration: underline;
  }

  .day-card {
    background: var(--color-surface);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .session {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .session h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-muted-strong);
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .empty-session {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  .empty {
    text-align: center;
    color: var(--color-muted);
  }

  .page.empty {
    padding-top: 2rem;
  }

  .optin {
    display: flex;
    justify-content: center;
    padding: 2.5rem 1.5rem;
  }

  .optin-card {
    width: 100%;
    max-width: 22rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    text-align: center;
  }

  .optin-card h1 {
    font-size: 1.25rem;
    margin: 0 0 0.25rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .subtitle {
    margin: 0 0 0.5rem;
    color: var(--color-muted-strong);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
