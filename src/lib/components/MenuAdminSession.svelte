<script lang="ts">
  import {
    nextOrder,
    parsePrice,
    reorder,
    type MenuItemData,
    type MenuSessionView,
  } from "../menu";
  import {
    addItem,
    applyOrder,
    deleteItem,
    deleteSessions,
    renameSession,
    updateItem,
  } from "../menuDb";
  import ChevronUp from "lucide-svelte/icons/chevron-up";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import Trash2 from "lucide-svelte/icons/trash-2";

  interface Props {
    view: MenuSessionView;
    index: number;
    count: number;
    voterCount: number;
    onMove: (dir: -1 | 1) => void;
  }

  let { view, index, count, voterCount, onMove }: Props = $props();

  const session = $derived(view.session);
  const sortedItems = $derived(view.items.map((s) => s.item));

  let newName = $state("");
  let newQuantity = $state("");
  let newPrice = $state("");
  let newDescription = $state("");
  let addError = $state<string | null>(null);

  function priceText(price: number): string {
    return price.toFixed(2).replace(".", ",");
  }

  function rename(input: HTMLInputElement) {
    const name = input.value.trim();
    if (!name) {
      input.value = session.name;
      return;
    }
    renameSession(session.id, name);
  }

  function removeSession() {
    const n = view.items.length;
    const warning =
      n > 0
        ? `Remover a sessão "${session.name}" e ${n} ${n === 1 ? "item" : "itens"} (com os votos)?`
        : `Remover a sessão "${session.name}"?`;
    if (!confirm(warning)) return;
    deleteSessions([session.id]);
  }

  function editName(item: MenuItemData, input: HTMLInputElement) {
    const name = input.value.trim();
    if (!name) {
      input.value = item.name;
      return;
    }
    updateItem(item.id, { name });
  }

  function editPrice(item: MenuItemData, input: HTMLInputElement) {
    const price = parsePrice(input.value);
    if (price === null) {
      input.value = priceText(item.price);
      return;
    }
    input.value = priceText(price);
    updateItem(item.id, { price });
  }

  function editText(
    item: MenuItemData,
    field: "quantity" | "description",
    value: string,
  ) {
    updateItem(item.id, { [field]: value.trim() });
  }

  function moveItem(itemIndex: number, dir: -1 | 1) {
    applyOrder("menuItems", reorder(sortedItems, itemIndex, dir));
  }

  function removeItem(item: MenuItemData) {
    if (!confirm(`Remover "${item.name}" (e os votos dele)?`)) return;
    deleteItem(item.id);
  }

  function submitItem(event: SubmitEvent) {
    event.preventDefault();
    const name = newName.trim();
    const price = parsePrice(newPrice);
    if (!name) {
      addError = "Informe o nome do item.";
      return;
    }
    if (price === null) {
      addError = "Preço inválido. Use algo como 80 ou 12,50.";
      return;
    }
    addItem(
      session.id,
      {
        name,
        price,
        quantity: newQuantity.trim(),
        description: newDescription.trim(),
      },
      nextOrder(sortedItems),
    );
    newName = "";
    newQuantity = "";
    newPrice = "";
    newDescription = "";
    addError = null;
  }
</script>

<div class="session">
  <div class="session-head">
    <input
      class="session-name"
      type="text"
      value={session.name}
      aria-label="Nome da sessão"
      onchange={(e) => rename(e.currentTarget)}
    />
    <button
      type="button"
      class="icon-btn"
      aria-label="Subir sessão"
      disabled={index === 0}
      onclick={() => onMove(-1)}><ChevronUp size={18} /></button
    >
    <button
      type="button"
      class="icon-btn"
      aria-label="Descer sessão"
      disabled={index === count - 1}
      onclick={() => onMove(1)}><ChevronDown size={18} /></button
    >
    <button
      type="button"
      class="icon-btn danger"
      aria-label="Remover sessão"
      onclick={removeSession}><Trash2 size={17} /></button
    >
  </div>

  {#if view.items.length > 0}
    <ul class="items">
      {#each view.items as scored, i (scored.item.id)}
        {@const item = scored.item}
        <li class="item" class:in-menu={scored.inMenu}>
          <div class="row">
            <input
              class="grow"
              type="text"
              value={item.name}
              aria-label="Nome do item"
              onchange={(e) => editName(item, e.currentTarget)}
            />
            <input
              class="qty"
              type="text"
              value={item.quantity ?? ""}
              placeholder="Qtd."
              aria-label="Quantidade"
              onchange={(e) =>
                editText(item, "quantity", e.currentTarget.value)}
            />
          </div>
          <div class="row">
            <label class="price">
              <span>R$</span>
              <input
                type="text"
                inputmode="decimal"
                value={priceText(item.price)}
                aria-label="Preço total"
                onchange={(e) => editPrice(item, e.currentTarget)}
              />
            </label>
          </div>
          <textarea
            rows="2"
            value={item.description ?? ""}
            placeholder="Descrição (opcional)"
            aria-label="Descrição"
            onchange={(e) =>
              editText(item, "description", e.currentTarget.value)}
          ></textarea>
          <div class="row foot">
            <span class="score" class:in-menu={scored.inMenu}
              >{scored.support}/{voterCount}
              {scored.inMenu ? "· no cardápio" : ""}</span
            >
            <button
              type="button"
              class="icon-btn"
              aria-label="Subir item"
              disabled={i === 0}
              onclick={() => moveItem(i, -1)}><ChevronUp size={18} /></button
            >
            <button
              type="button"
              class="icon-btn"
              aria-label="Descer item"
              disabled={i === view.items.length - 1}
              onclick={() => moveItem(i, 1)}><ChevronDown size={18} /></button
            >
            <button
              type="button"
              class="icon-btn danger"
              aria-label="Remover item"
              onclick={() => removeItem(item)}><Trash2 size={17} /></button
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <form class="add-item" onsubmit={submitItem}>
    <div class="row">
      <input
        class="grow"
        type="text"
        placeholder="Novo item (ex.: Picanha)"
        bind:value={newName}
      />
      <input class="qty" type="text" placeholder="Qtd." bind:value={newQuantity} />
    </div>
    <div class="row">
      <label class="price">
        <span>R$</span>
        <input
          type="text"
          inputmode="decimal"
          placeholder="Preço total"
          bind:value={newPrice}
        />
      </label>
      <button type="submit" class="add-btn">Adicionar item</button>
    </div>
    <textarea
      rows="2"
      placeholder="Descrição (opcional)"
      bind:value={newDescription}
    ></textarea>
    {#if addError}
      <p class="error">{addError}</p>
    {/if}
  </form>
</div>

<style>
  .session {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background: var(--color-bg);
  }

  .session-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .session-name {
    flex: 1;
    min-width: 0;
    font-weight: 700;
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem;
    border-radius: 0.65rem;
    background: var(--color-surface);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .item.in-menu {
    border-color: rgba(47, 158, 92, 0.45);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .grow {
    flex: 1;
    min-width: 0;
  }

  .qty {
    width: 5.5rem;
    flex: none;
  }

  input,
  textarea {
    font-size: 0.9rem;
    padding: 0.5rem 0.6rem;
  }

  textarea {
    font-family: inherit;
    border-radius: 0.6rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    background: var(--color-surface);
    color: var(--color-text);
    width: 100%;
    resize: vertical;
  }

  textarea:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }

  .price {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--color-muted-strong);
  }

  .price input {
    flex: 1;
    min-width: 0;
  }

  .foot {
    justify-content: flex-end;
  }

  .score {
    flex: 1;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-strong);
  }

  .score.in-menu {
    color: var(--color-accent);
  }

  .icon-btn {
    background: none;
    color: var(--color-muted-strong);
    padding: 0.35rem;
    display: flex;
    flex: none;
  }

  .icon-btn.danger {
    color: var(--color-danger);
  }

  .icon-btn:disabled {
    opacity: 0.25;
  }

  .add-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-top: 0.25rem;
  }

  .add-btn {
    flex: none;
    font-size: 0.85rem;
    padding: 0.55rem 0.8rem;
  }

  .error {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-danger);
  }
</style>
