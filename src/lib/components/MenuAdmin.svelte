<script lang="ts">
  import MenuCardHeader from "./MenuCardHeader.svelte";
  import MenuAdminSession from "./MenuAdminSession.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import {
    MAX_TRIP_DAYS,
    nextOrder,
    parsePayingCount,
    reorder,
    tripDays,
    type MenuCard,
  } from "../menu";
  import {
    useMenuQuery,
    readMenu,
    updateMenuSettings,
    addSession,
    applyOrder,
    deleteSessions,
  } from "../menuDb";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const query = useMenuQuery();
  const menu = $derived(readMenu(query.data));
  const settings = $derived(menu.settings);
  const voterCount = $derived(menu.state.voters.length);

  /**
   * Collapsed session ids. Per-admin convenience only, so it lives in this
   * browser's localStorage (wrapped: storage can be blocked or empty).
   */
  const COLLAPSED_KEY = "um_menu_admin_collapsed";

  function loadCollapsed(): string[] {
    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem(COLLAPSED_KEY) ?? "[]",
      );
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  }

  const collapsed = new SvelteSet<string>(loadCollapsed());

  $effect(() => {
    const ids = JSON.stringify([...collapsed]);
    try {
      localStorage.setItem(COLLAPSED_KEY, ids);
    } catch {
      // Not persisting is fine: it only resets the collapsed state.
    }
  });

  const allSessionIds = $derived(
    menu.state.cards.flatMap((card) => card.sessions.map((s) => s.session.id)),
  );

  function toggleCollapsed(sessionId: string) {
    if (collapsed.has(sessionId)) collapsed.delete(sessionId);
    else collapsed.add(sessionId);
  }

  function collapseAll() {
    collapsed.clear();
    for (const sessionId of allSessionIds) collapsed.add(sessionId);
  }

  /** New-session name drafts, keyed by card. */
  let drafts = $state<Record<string, string>>({});

  function changePayingCount(input: HTMLInputElement) {
    const payingCount = parsePayingCount(input.value);
    if (payingCount === null) {
      input.value = String(settings?.payingCount ?? "");
      return;
    }
    updateMenuSettings({ payingCount });
  }

  function changePeriod(
    field: "arrivalDate" | "departureDate",
    input: HTMLInputElement,
  ) {
    const previous = settings?.[field] ?? "";
    const arrival = field === "arrivalDate" ? input.value : settings?.arrivalDate;
    const departure =
      field === "departureDate" ? input.value : settings?.departureDate;
    const days = tripDays(arrival, departure);

    if (arrival && departure && days.length === 0) {
      alert(
        `A saída precisa ser no mesmo dia ou depois da chegada (máximo de ${MAX_TRIP_DAYS} dias).`,
      );
      input.value = previous;
      return;
    }

    // Dated sessions that would fall outside the new period get deleted
    // (with their items); "Geral" sessions are never affected.
    const orphans = (query.data?.menuSessions ?? []).filter(
      (s) => s.date && !days.includes(s.date),
    );
    if (orphans.length > 0) {
      const ok = confirm(
        `O novo período deixa ${orphans.length} ${orphans.length === 1 ? "sessão" : "sessões"} de fora (${orphans.map((s) => s.name).join(", ")}). Elas e seus itens serão removidos. Continuar?`,
      );
      if (!ok) {
        input.value = previous;
        return;
      }
      deleteSessions(orphans.map((s) => s.id));
    }
    updateMenuSettings({ [field]: input.value });
  }

  function submitSession(event: SubmitEvent, card: MenuCard) {
    event.preventDefault();
    const name = (drafts[card.key] ?? "").trim();
    if (!name) return;
    addSession(
      card.date,
      name,
      nextOrder(card.sessions.map((s) => s.session)),
    );
    drafts[card.key] = "";
  }

  function moveSession(card: MenuCard, index: number, dir: -1 | 1) {
    applyOrder(
      "menuSessions",
      reorder(
        card.sessions.map((s) => s.session),
        index,
        dir,
      ),
    );
  }
</script>

<div class="page">
  <header class="topbar">
    <h1>Admin do cardápio</h1>
    <button type="button" class="link" onclick={onClose}>Fechar</button>
  </header>

  {#if query.isLoading}
    <p class="empty">Carregando...</p>
  {:else}
    <section class="globals">
      <label>
        Pessoas pagantes
        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          value={settings?.payingCount ?? ""}
          placeholder="Ex.: 10"
          onchange={(e) => changePayingCount(e.currentTarget)}
        />
      </label>
      <div class="dates">
        <label>
          Chegada
          <input
            type="date"
            value={settings?.arrivalDate ?? ""}
            onchange={(e) => changePeriod("arrivalDate", e.currentTarget)}
          />
        </label>
        <label>
          Saída
          <input
            type="date"
            value={settings?.departureDate ?? ""}
            onchange={(e) => changePeriod("departureDate", e.currentTarget)}
          />
        </label>
      </div>
      <p class="hint">
        O custo por pessoa divide o total pelos pagantes. Os votantes (hoje
        {voterCount}) só decidem quais itens entram.
      </p>
    </section>

    {#if allSessionIds.length > 0}
      <div class="collapse-all">
        <button type="button" class="link" onclick={collapseAll}
          >Recolher todas as sessões</button
        >
        <button type="button" class="link" onclick={() => collapsed.clear()}
          >Expandir todas</button
        >
      </div>
    {/if}

    {#if menu.state.days.length === 0}
      <p class="empty">Defina chegada e saída para montar os dias da viagem.</p>
    {/if}

    {#each menu.state.cards as card (card.key)}
      <section class="day-card">
        <MenuCardHeader date={card.date} />

        {#each card.sessions as view, i (view.session.id)}
          <MenuAdminSession
            {view}
            index={i}
            count={card.sessions.length}
            {voterCount}
            onMove={(dir) => moveSession(card, i, dir)}
            collapsed={collapsed.has(view.session.id)}
            onToggleCollapse={() => toggleCollapsed(view.session.id)}
          />
        {/each}

        <form class="add-session" onsubmit={(e) => submitSession(e, card)}>
          <input
            type="text"
            placeholder={card.date
              ? "Nova sessão (ex.: Churrasco noite)"
              : "Nova sessão geral (ex.: Café da manhã)"}
            bind:value={drafts[card.key]}
          />
          <button type="submit" disabled={!(drafts[card.key] ?? "").trim()}
            >Adicionar sessão</button
          >
        </form>
      </section>
    {/each}

    <section class="voters">
      <h2>Votantes ({voterCount})</h2>
      <p>
        {menu.state.voters.map((p) => p.name).join(", ") ||
          "Ninguém entrou na votação ainda."}
      </p>
    </section>
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

  .link {
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.85rem;
    padding: 0.25rem;
    text-decoration: underline;
  }

  .globals {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dates {
    display: flex;
    gap: 0.75rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--color-muted-strong);
    flex: 1;
    min-width: 0;
  }

  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted);
    line-height: 1.4;
  }

  .collapse-all {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-bottom: -0.5rem;
  }

  .day-card {
    background: var(--color-surface);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .add-session {
    display: flex;
    gap: 0.5rem;
  }

  .add-session input {
    flex: 1;
    min-width: 0;
    font-size: 0.9rem;
    padding: 0.55rem 0.7rem;
  }

  .add-session button {
    flex: none;
    font-size: 0.85rem;
    padding: 0.55rem 0.8rem;
  }

  .voters h2 {
    font-size: 0.9rem;
    margin: 0 0 0.35rem;
    color: var(--color-muted-strong);
  }

  .voters p {
    margin: 0;
    font-size: 0.85rem;
  }

  .empty {
    text-align: center;
    color: var(--color-muted);
    margin: 0;
  }
</style>
