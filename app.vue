<script lang="ts" setup>
import type { FormSubmitEvent } from "#ui/types";

interface AuthState {
  savePAT: boolean;
  PAT: string;
  organization: string;
  team: string;
  project: string;
}

useState("organization", () => localStorage.getItem("organization"));
useState("project", () => localStorage.getItem("project"));
useState("team", () => localStorage.getItem("team"));
useState("PAT", () => localStorage.getItem("PAT"));

const isPATStored = ref(localStorage.getItem("PAT") !== null);

const state: Ref<AuthState> = ref({
  savePAT: isPATStored.value,
  PAT: localStorage.getItem("PAT") ?? "",
  organization: localStorage.getItem("organization") ?? "BARKFORS",
  team: localStorage.getItem("team") ?? "T5 Team",
  project: localStorage.getItem("project") ?? "T5",
});

const alertText = computed(() =>
  isPATStored.value
    ? "Your Personal Access Token is stored in local storage."
    : "Your Personal Access Token is not stored.",
);

const isSetupOpen = ref(false);

function checkPATStorage(): boolean {
  return (isPATStored.value = localStorage.getItem("PAT") !== null);
}

function clearPAT() {
  localStorage.removeItem("PAT");
  checkPATStorage();
}

async function onSubmit(data: FormSubmitEvent<AuthState>) {
  const { PAT, savePAT, organization, team, project } = data.data;
  if (savePAT) localStorage.setItem("PAT", PAT);
  useState("PAT").value = PAT;

  localStorage.setItem("organization", organization);
  useState("organization").value = organization;

  localStorage.setItem("project", project);
  useState("project").value = project;

  localStorage.setItem("team", team);
  useState("team").value = team;

  isSetupOpen.value = false;

  checkPATStorage();
}
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <div class="flex flex-1 h-full">
      <UContainer class="flex-1 flex-col flex w-full">
        <NuxtRouteAnnouncer /><UHeader>
          <template #logo>
            <p>DevOps Business Intelligence</p>
          </template>

          <template #right>
            <UColorModeButton />

            <UButton
              @click="isSetupOpen = true"
              icon="i-heroicons-cog-8-tooth"
              color="gray"
              variant="ghost"
            />
          </template>
        </UHeader>
        <NuxtPage />
        <UModal v-model="isSetupOpen">
          <UCard>
            <template #header>
              <p>Configuration</p>
            </template>
            <div class="flex flex-col gap-8">
              <UAlert
                :color="isPATStored ? 'red' : 'green'"
                variant="outline"
                :icon="
                  isPATStored
                    ? 'i-heroicons-exclamation-triangle'
                    : 'i-heroicons-shield-check'
                "
                :actions="
                  isPATStored
                    ? [{ label: 'Clear local storage', click: clearPAT }]
                    : []
                "
                :title="alertText"
              />
              <UForm :state="state" class="space-y-6" @submit="onSubmit">
                <UFormGroup label="Organization" name="organization">
                  <UInput v-model="state.organization" type="text" />
                </UFormGroup>
                <UFormGroup label="Project" name="project">
                  <UInput v-model="state.project" type="text" />
                </UFormGroup>
                <UFormGroup label="Team" name="team">
                  <UInput v-model="state.team" type="text" />
                </UFormGroup>
                <UFormGroup label="Personal Access Token (PAT)" name="pat">
                  <UInput
                    v-model="state.PAT"
                    type="password"
                    icon="i-heroicons-key"
                  />
                </UFormGroup>
                <UFormGroup label="" name="save-pat">
                  <UCheckbox
                    label="Save PAT in local storage (insecure)"
                    v-model="state.savePAT"
                  />
                </UFormGroup>

                <UButton type="submit"> Save </UButton>
              </UForm>
            </div></UCard
          ></UModal
        >
      </UContainer>
      <FilterMenu />
    </div>

    <UNotifications />
  </div>
</template>
