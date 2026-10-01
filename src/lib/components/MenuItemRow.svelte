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
</script>

<li class="item" class:in-menu={scored.inMenu}>
  <button
    type="button"
    class="item-main"
    disabled={!canVote}
    aria-pressed={canVote ? liked : undefined}
    onclick={onToggle}
  >
    {#if canVote}
      <span class="check" class:liked>
        {#if liked}
          <CheckCircle2 size={20} />
        {:else}
          <Circle size={20} />
        {/if}
      </span>
    {/if}
    <span class="body">
      <span class="name-line">
        <span class="name">{item.name}</span>
        {#if item.quantity}
          <span class="qty">{item.quantity}</span>
        {/if}
      </span>
      {#if item.description}
        <span class="desc">{item.description}</span>
      {/if}
    </span>
    <span class="side">
      <span class="price">{formatBRL(item.price)}</span>
      <span class="score" class:in-menu={scored.inMenu}
        >{scored.support}/{voterCount}</span
      >
    </span>
  </button>

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

  .name-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.15rem 0.45rem;
  }

  .name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .qty {
    font-size: 0.75rem;
    color: var(--color-muted-strong);
    background: rgba(0, 0, 0, 0.05);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
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
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .price {
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
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
