<script lang="ts">
  interface Props {
    participantId: string;
  }

  let { participantId }: Props = $props();
</script>

<p data-participant={participantId}>Cardápio</p>
