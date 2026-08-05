<script lang="ts">
  import PasswordGate from "./lib/components/PasswordGate.svelte";
  import IdentityGate from "./lib/components/IdentityGate.svelte";
  import MainView from "./lib/components/MainView.svelte";
  import AdminPanel from "./lib/components/AdminPanel.svelte";
  import { db } from "./lib/db";
  import {
    getStoredParticipantId,
    clearStoredParticipantId,
    type Participant,
  } from "./lib/participants";
  import {
    isAppUnlocked,
    tryUnlockApp,
    isAdminUnlocked,
    tryUnlockAdmin,
  } from "./lib/gate";

  let appUnlocked = $state(isAppUnlocked());
  let participant = $state<Participant | null>(null);
  let checkingStoredIdentity = $state(true);
  let view = $state<"main" | "admin">("main");
  let adminUnlocked = $state(isAdminUnlocked());

  $effect(() => {
    if (!appUnlocked) return;

    const storedId = getStoredParticipantId();
    if (!storedId) {
      checkingStoredIdentity = false;
      return;
    }

    db.queryOnce({ participants: { $: { where: { id: storedId } } } }).then(
      ({ data }) => {
        if (data.participants.length > 0) {
          participant = data.participants[0] as Participant;
        } else {
          clearStoredParticipantId();
        }
        checkingStoredIdentity = false;
      },
    );
  });

  function handleIdentified(p: Participant) {
    participant = p;
  }

  function handleChangeUser() {
    clearStoredParticipantId();
    participant = null;
  }
</script>

{#if !appUnlocked}
  <PasswordGate
    title="Operação Última Missão"
    subtitle="Digite a senha para entrar"
    check={tryUnlockApp}
    onUnlocked={() => (appUnlocked = true)}
  />
{:else if checkingStoredIdentity}
  <p class="loading">Carregando...</p>
{:else if !participant}
  <IdentityGate onIdentified={handleIdentified} />
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
    onChangeName={handleChangeUser}
    onOpenAdmin={() => (view = "admin")}
  />
{/if}

<style>
  .loading {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-muted);
  }
</style>
