<script lang="ts">
  import { router, routeHref, type Section } from "../router.svelte";

  interface Props {
    participantName: string;
    onChangeName: () => void;
  }

  let { participantName, onChangeName }: Props = $props();

  const tabs: { section: Section; label: string }[] = [
    { section: "cardapio", label: "Cardápio" },
    { section: "data", label: "Data" },
  ];
</script>

<header class="nav">
  <div class="topbar">
    <div class="who">
      Olá, <strong>{participantName}</strong>
      <button type="button" class="link" onclick={onChangeName}
        >Trocar usuário</button
      >
    </div>
    <a class="link" href={routeHref(router.section, true)}>Admin</a>
  </div>

  <nav class="tabs">
    {#each tabs as tab (tab.section)}
      <a
        href={routeHref(tab.section)}
        class="tab"
        class:active={router.section === tab.section}
        aria-current={router.section === tab.section ? "page" : undefined}
        >{tab.label}</a
      >
    {/each}
  </nav>
</header>

<style>
  .nav {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1rem 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .link {
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.85rem;
    padding: 0.25rem;
    text-decoration: underline;
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 0.75rem;
    padding: 0.25rem;
  }

  .tab {
    flex: 1;
    text-align: center;
    padding: 0.5rem;
    border-radius: 0.55rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-muted-strong);
    text-decoration: none;
  }

  .tab.active {
    background: var(--color-surface);
    color: var(--color-accent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .tab:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
</style>
