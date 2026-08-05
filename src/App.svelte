<script lang="ts">
  import PasswordGate from "./lib/components/PasswordGate.svelte";
  import NameGate from "./lib/components/NameGate.svelte";
  import MainView from "./lib/components/MainView.svelte";
  import AdminPanel from "./lib/components/AdminPanel.svelte";
  import {
    getParticipant,
    saveParticipantName,
    forgetParticipantName,
  } from "./lib/participant";
  import {
    isAppUnlocked,
    tryUnlockApp,
    isAdminUnlocked,
    tryUnlockAdmin,
  } from "./lib/gate";
  import { syncParticipantNameAcrossVotes } from "./lib/votes";

  let appUnlocked = $state(isAppUnlocked());
  let participant = $state(getParticipant());
  let view = $state<"main" | "admin">("main");
  let adminUnlocked = $state(isAdminUnlocked());

  function handleNameSubmit(name: string) {
    const wasNamed = !!participant?.name;
    const previousId = participant?.id;
    participant = saveParticipantName(name);

    if (wasNamed && previousId === participant.id) {
      syncParticipantNameAcrossVotes(participant.id, name);
    }
  }

  function handleChangeName() {
    forgetParticipantName();
    participant = getParticipant();
  }
</script>

{#if !appUnlocked}
  <PasswordGate
    title="Operação Última Missão"
    subtitle="Digite a senha para entrar"
    check={tryUnlockApp}
    onUnlocked={() => (appUnlocked = true)}
  />
{:else if !participant || participant.name.length === 0}
  <NameGate onSubmit={handleNameSubmit} />
{:else if view === "admin"}
  {#if !adminUnlocked}
    <PasswordGate
      title="Área do admin"
      subtitle="Digite a senha de administrador"
      check={tryUnlockAdmin}
      onUnlocked={() => (adminUnlocked = true)}
      onCancel={() => (view = "main")}
    />
  {:else}
    <AdminPanel onClose={() => (view = "main")} />
  {/if}
{:else}
  <MainView
    participantId={participant.id}
    participantName={participant.name}
    onChangeName={handleChangeName}
    onOpenAdmin={() => (view = "admin")}
  />
{/if}
