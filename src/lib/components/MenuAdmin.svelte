<script lang="ts">
  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<button type="button" onclick={onClose}>Fechar</button>
