<script lang="ts">
  import PasswordGate from "./lib/components/PasswordGate.svelte";
  import LoginGate from "./lib/components/LoginGate.svelte";
  import NicknameGate from "./lib/components/NicknameGate.svelte";
  import NavBar from "./lib/components/NavBar.svelte";
  import DatesClosed from "./lib/components/DatesClosed.svelte";
  import MenuView from "./lib/components/MenuView.svelte";
  import MenuAdmin from "./lib/components/MenuAdmin.svelte";
  import { router, navigate } from "./lib/router.svelte";
  import { db } from "./lib/db";
  import {
    isAppUnlocked,
    tryUnlockApp,
    isAdminUnlocked,
    tryUnlockAdmin,
  } from "./lib/gate";

  let appUnlocked = $state(isAppUnlocked());
  let adminUnlocked = $state(isAdminUnlocked());

  const auth = db.useAuth();

  // The logged-in user's participant (nickname, votes). Live, so it appears
  // as soon as NicknameGate creates it.
  const participantQuery = db.useQuery(() =>
    auth.user
      ? { participants: { $: { where: { "user.id": auth.user.id } } } }
      : null,
  );
  const participant = $derived(participantQuery.data?.participants[0] ?? null);

  function signOut() {
    db.auth.signOut();
  }
</script>

{#if !appUnlocked}
  <PasswordGate
    title="Operação Última Missão"
    subtitle="Digite a senha para entrar"
    check={tryUnlockApp}
    onUnlocked={() => (appUnlocked = true)}
  />
{:else if auth.isLoading}
  <p class="loading">Carregando...</p>
{:else if !auth.user}
  <LoginGate />
{:else if participantQuery.isLoading}
  <p class="loading">Carregando...</p>
{:else if !participant}
  <NicknameGate
    userId={auth.user.id}
    email={auth.user.email ?? ""}
    onSignOut={signOut}
  />
{:else if router.admin && router.section !== "data" && !adminUnlocked}
  <PasswordGate
    title="Área do admin"
    subtitle="Digite a senha de administrador"
    check={tryUnlockAdmin}
    onUnlocked={() => (adminUnlocked = true)}
    onCancel={() => navigate(router.section)}
  />
{:else}
  <NavBar participantName={participant.name} onSignOut={signOut} />
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
