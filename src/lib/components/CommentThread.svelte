<script lang="ts">
  import { MessageCircle, Trash2 } from "lucide-svelte";
  import {
    COMMENT_MAX,
    canDeleteComment,
    sortComments,
    validateComment,
  } from "../comments";
  import {
    useCommentsQuery,
    addComment,
    deleteComment,
    type CommentParent,
  } from "../commentsDb";

  interface Props {
    parent: CommentParent;
    participantId: string;
    /** Admin pages can delete anyone's comment. */
    admin?: boolean;
  }

  let { parent, participantId, admin = false }: Props = $props();

  const query = useCommentsQuery(() => parent);
  const comments = $derived(sortComments(query.data?.comments ?? []));

  let open = $state(false);
  let draft = $state("");
  let busy = $state(false);
  let error = $state(false);

  const timeFormat = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const text = validateComment(draft);
    if (!text) return;
    busy = true;
    error = false;
    try {
      await addComment(parent, participantId, text);
      draft = "";
    } catch {
      error = true;
    } finally {
      busy = false;
    }
  }

  function remove(commentId: string) {
    if (confirm("Apagar este comentário?")) deleteComment(commentId);
  }
</script>

<div class="thread">
  <button
    type="button"
    class="toggle"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <MessageCircle size={15} />
    Comentários ({comments.length})
  </button>

  {#if open}
    {#if comments.length > 0}
      <ul class="list">
        {#each comments as comment (comment.id)}
          <li>
            <div class="meta">
              <strong>{comment.author?.name ?? "Alguém"}</strong>
              <span>{timeFormat.format(comment.createdAt)}</span>
              {#if canDeleteComment(comment, participantId, admin)}
                <button
                  type="button"
                  class="delete"
                  aria-label="Apagar comentário"
                  onclick={() => remove(comment.id)}
                >
                  <Trash2 size={14} />
                </button>
              {/if}
            </div>
            <p class="text">{comment.text}</p>
          </li>
        {/each}
      </ul>
    {/if}

    <form class="new" onsubmit={submit}>
      <textarea
        rows="2"
        maxlength={COMMENT_MAX}
        placeholder="Escreva um comentário"
        bind:value={draft}
      ></textarea>
      {#if error}
        <p class="error">Não foi possível comentar. Tente de novo.</p>
      {/if}
      <button type="submit" disabled={busy || validateComment(draft) === null}
        >{busy ? "Enviando..." : "Comentar"}</button
      >
    </form>
  {/if}
</div>

<style>
  .thread {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toggle {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    color: var(--color-muted-strong);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .list li {
    background: rgba(0, 0, 0, 0.035);
    border-radius: 0.6rem;
    padding: 0.45rem 0.6rem;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--color-muted-strong);
  }

  .meta strong {
    color: var(--color-text);
  }

  .delete {
    margin-left: auto;
    background: none;
    color: var(--color-muted);
    padding: 0.15rem;
    display: inline-flex;
  }

  .text {
    margin: 0.2rem 0 0;
    font-size: 0.875rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .new {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.875rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    padding: 0.5rem 0.7rem;
    resize: vertical;
  }

  .new button {
    align-self: flex-end;
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .error {
    color: var(--color-danger);
    font-size: 0.8rem;
    margin: 0;
  }
</style>
