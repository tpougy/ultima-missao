<script lang="ts">
  import MenuCardHeader from "./MenuCardHeader.svelte";
  import MenuItemRow from "./MenuItemRow.svelte";
  import { formatBRL, perPerson, sessionProgress } from "../menu";
  import { parseISODate, dayLabel, dayNumber } from "../dates";
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

  /** One shortcut chip per visible session, in page order. */
  const shortcuts = $derived(
    visibleCards.flatMap((card) => {
      const date = card.date ? parseISODate(card.date) : null;
      const day = date ? `${dayLabel(date)} ${dayNumber(date)}` : "Geral";
      return card.sessions.map((view) => ({
        id: view.session.id,
        day,
        name: view.session.name,
        progress: sessionProgress(view, participantId),
      }));
    }),
  );

  let header = $state<HTMLElement>();
  let chipBar = $state<HTMLElement>();
  let activeId = $state<string | null>(null);
  let scrollFrame = 0;
  /**
   * After tapping a chip, keep it highlighted until the smooth scroll
   * settles: near the end of the page the scroll can stop short of the
   * target, and the scroll-position rule would pick a different session.
   */
  let jumping = false;
  let jumpTimer: ReturnType<typeof setTimeout> | undefined;

  function settleJump() {
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(() => (jumping = false), 150);
  }

  function sessionElement(sessionId: string): HTMLElement | null {
    return document.getElementById(`session-${sessionId}`);
  }

  /** The active session is the last one whose top passed under the header. */
  function updateActive() {
    scrollFrame = 0;
    if (!header || shortcuts.length === 0) return;
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) {
      activeId = shortcuts[shortcuts.length - 1].id;
      return;
    }
    const line = header.getBoundingClientRect().bottom + 16;
    let current = shortcuts[0].id;
    for (const shortcut of shortcuts) {
      const el = sessionElement(shortcut.id);
      if (el && el.getBoundingClientRect().top <= line) current = shortcut.id;
    }
    activeId = current;
  }

  function onScroll() {
    if (jumping) {
      settleJump();
      return;
    }
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateActive);
  }

  function jumpTo(sessionId: string) {
    const el = sessionElement(sessionId);
    if (!el || !header) return;
    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      header.offsetHeight -
      8;
    activeId = sessionId;
    jumping = true;
    settleJump();
    window.scrollTo({ top, behavior: "smooth" });
  }

  // Recompute when sessions appear/disappear (live data).
  $effect(() => {
    void shortcuts.length;
    const frame = requestAnimationFrame(updateActive);
    return () => cancelAnimationFrame(frame);
  });

  // Keep the active chip visible in the horizontally scrolling bar.
  $effect(() => {
    if (!chipBar || !activeId) return;
    const chip = chipBar.querySelector<HTMLElement>(
      `[data-session="${activeId}"]`,
    );
    if (!chip) return;
    chipBar.scrollTo({
      left: chip.offsetLeft - (chipBar.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  });

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

<svelte:window onscroll={onScroll} />

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
    <div class="totals" bind:this={header}>
      <p class="totals-label">Alimentação por pessoa</p>
      <p class="per-person">{each === null ? "—" : formatBRL(each)}</p>
      <p class="total">Total {formatBRL(menu.state.total)}</p>
      <p class="meta">
        {voterCount}
        {voterCount === 1 ? "votante" : "votantes"} ·
        {payingCount ?? "—"}
        {payingCount === 1 ? "pagante" : "pagantes"}
      </p>
      {#if shortcuts.length > 1}
        <nav class="shortcuts" aria-label="Ir para a sessão" bind:this={chipBar}>
          {#each shortcuts as shortcut (shortcut.id)}
            <button
              type="button"
              class="chip"
              class:active={activeId === shortcut.id}
              aria-current={activeId === shortcut.id ? "true" : undefined}
              data-session={shortcut.id}
              onclick={() => jumpTo(shortcut.id)}
            >
              <span class="chip-day">{shortcut.day}</span>
              {shortcut.name}
              {#if isVoter && shortcut.progress.votable > 0}
                <span class="chip-count"
                  >{shortcut.progress.voted}/{shortcut.progress.votable}</span
                >
              {/if}
            </button>
          {/each}
        </nav>
      {/if}
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
            {@const progress = sessionProgress(view, participantId)}
            <div class="session" id="session-{view.session.id}">
              <div class="session-head">
                <h3>{view.session.name}</h3>
                {#if isVoter && progress.votable > 0}
                  <span class="progress"
                    >você votou em {progress.voted} de {progress.votable}</span
                  >
                {/if}
              </div>
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

  .session-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  .progress {
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .shortcuts {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    margin: 0.65rem -1rem 0;
    padding: 0.1rem 1rem;
    scrollbar-width: none;
    text-align: left;
  }

  .shortcuts::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    white-space: nowrap;
  }

  .chip-day {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-accent);
  }

  .chip-count {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--color-muted-strong);
  }

  .chip.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  .chip.active .chip-day,
  .chip.active .chip-count {
    color: rgba(255, 255, 255, 0.85);
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
