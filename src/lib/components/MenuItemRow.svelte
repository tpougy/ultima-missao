<script lang="ts">
  import { formatBRL, type ScoredItem } from "../menu";
  import Info from "lucide-svelte/icons/info";
  import CheckCircle2 from "lucide-svelte/icons/check-circle-2";
  import Circle from "lucide-svelte/icons/circle";

  interface Props {
    scored: ScoredItem;
    voterCount: number;
    /** Whether the current participant wants this item. */
    liked: boolean;
    /** Only voters can toggle; everyone else sees the row read-only. */
    canVote: boolean;
    onToggle: () => void;
  }

  let { scored, voterCount, liked, canVote, onToggle }: Props = $props();

  let infoOpen = $state(false);

  const item = $derived(scored.item);
  /** Required items are always in the menu and can't be voted on. */
  const votable = $derived(canVote && !item.required);
</script>

<li class="item" class:in-menu={scored.inMenu}>
  <button
    type="button"
    class="item-main"
    disabled={!votable}
    aria-pressed={votable ? liked : undefined}
    onclick={onToggle}
  >
    {#if votable}
      <span class="check" class:liked>
        {#if liked}
          <CheckCircle2 size={20} />
        {:else}
          <Circle size={20} />
        {/if}
      </span>
    {/if}
    <span class="body">
      <span class="name">{item.name}</span>
      <!-- The price is the item's total cost; tying it to the quantity (or
           saying "no total") keeps it from being read as a unit price. -->
      <span class="price-line">
        {#if item.quantity}
          {item.quantity} por <strong>{formatBRL(item.price)}</strong>
        {:else}
          <strong>{formatBRL(item.price)}</strong> no total
        {/if}
      </span>
      {#if item.description}
        <span class="desc">{item.description}</span>
      {/if}
    </span>
    <span class="side">
      {#if item.required}
        <span class="score in-menu">Obrigatório</span>
      {:else}
        <span class="score" class:in-menu={scored.inMenu}
          >{scored.support}/{voterCount}</span
        >
      {/if}
    </span>
  </button>

  {#if !item.required}
    <div class="info-wrap">
      <button
        type="button"
        class="info-btn"
        aria-label="Ver quem votou"
        onclick={() => (infoOpen = !infoOpen)}
      >
        <Info size={15} />
      </button>
      {#if infoOpen}
        <button
          type="button"
          class="info-backdrop"
          aria-label="Fechar"
          onclick={() => (infoOpen = false)}
        ></button>
        <div class="info-popover">
          <p class="info-title">
            {scored.inMenu ? "No cardápio" : "Fora do cardápio"} ({scored.support}/{voterCount})
          </p>
          <p class="info-names">
            {scored.likers.map((p) => p.name).join(", ") || "Ninguém votou ainda"}
          </p>
        </div>
      {/if}
    </div>
  {/if}
</li>

<style>
  .item {
    position: relative;
    display: flex;
    align-items: stretch;
    background: var(--color-surface);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 0.75rem;
  }

  .item.in-menu {
    background: hsl(142deg 45% 95%);
    border-color: rgba(47, 158, 92, 0.45);
  }

  .item-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    background: none;
    color: var(--color-text);
    text-align: left;
    padding: 0.7rem 0.25rem 0.7rem 0.75rem;
    border-radius: 0.75rem;
  }

  /* No (i) button next to it (required items): keep the right padding. */
  .item-main:last-child {
    padding-right: 0.75rem;
  }

  .item-main:disabled {
    opacity: 1;
    cursor: default;
  }

  .check {
    display: flex;
    flex: none;
    color: var(--color-muted);
    padding-top: 0.05rem;
  }

  .check.liked {
    color: var(--color-accent);
  }

  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .price-line {
    font-size: 0.82rem;
    color: var(--color-muted-strong);
  }

  .price-line strong {
    color: var(--color-text);
    white-space: nowrap;
  }

  .desc {
    font-size: 0.8rem;
    color: var(--color-muted-strong);
    line-height: 1.4;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .side {
    flex: none;
    align-self: center;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .score {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-strong);
    background: rgba(0, 0, 0, 0.05);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
  }

  .score.in-menu {
    background: var(--color-accent);
    color: white;
  }

  .info-wrap {
    position: relative;
    display: flex;
    align-items: flex-start;
  }

  .info-btn {
    background: none;
    color: var(--color-muted-strong);
    padding: 0.75rem 0.6rem 0.5rem 0.35rem;
    line-height: 1;
    display: flex;
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
    top: 2.1rem;
    right: 0.3rem;
    z-index: 11;
    width: 13rem;
    background: white;
    border-radius: 0.6rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    padding: 0.6rem 0.7rem;
    text-align: left;
  }

  .info-title {
    margin: 0 0 0.15rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-muted-strong);
  }

  .info-names {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text);
    line-height: 1.3;
  }
</style>
