<script lang="ts">
  import PasswordGate from "./lib/components/PasswordGate.svelte";
  import IdentityGate from "./lib/components/IdentityGate.svelte";
  import DatesClosed from "./lib/components/DatesClosed.svelte";
  import NavBar from "./lib/components/NavBar.svelte";
  import MenuView from "./lib/components/MenuView.svelte";
  import MenuAdmin from "./lib/components/MenuAdmin.svelte";
  import { router, navigate } from "./lib/router.svelte";
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
{:else if router.admin && router.section !== "data" && !adminUnlocked}
  <PasswordGate
    title="Área do admin"
    subtitle="Digite a senha de administrador"
    check={tryUnlockAdmin}
    onUnlocked={() => (adminUnlocked = true)}
    onCancel={() => navigate(router.section)}
  />
{:else}
  <NavBar participantName={participant.name} onSignOut={handleChangeUser} />
  {#if router.section === "data"}
    <DatesClosed />
  {:else if router.section === "bebidas"}
    <p class="loading">Em breve.</p>
  {:else if router.admin}
    <MenuAdmin onClose={() => navigate("cardapio")} />
  {:else}
    <MenuView participantId={participant.id} />
  {/if}
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
