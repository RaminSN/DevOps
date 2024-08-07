<script lang="ts" setup>
import {
  type IterationWorkItems,
  type GenericResponse,
  type TeamSettingsIteration,
  type WorkItem,
} from "~/types";
import { sub, format, isSameDay, type Duration } from "date-fns";

const toast = useToast();

const organization = computed(() => useState("organization").value);
const project = computed(() => useState("project").value);
const team = computed(() => useState("team").value);
const PAT = computed(() => useState("PAT").value);

const encodedBasicAuthString = computed(() => {
  return btoa(`:${PAT.value}`);
});

const baseURL = computed(
  () => `https://dev.azure.com/${organization.value}/${project.value}`,
);

const wiqlURL = `/${team.value}/_apis/wit/wiql?api-version=7.2-preview.2`;
const workItemURL = "/_apis/wit/workitemsbatch?api-version=7.2-preview.1";
const iterationsURL = `/${team.value}/_apis/work/teamsettings/iterations?api-version=7.2-preview.1`;

function getIterationWorkItemsURL(iterationId: string) {
  return `/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=7.0`;
}

const customFetch = $fetch.create({
  baseURL: baseURL.value,
  onRequest({ request, options }) {
    const headers = (options.headers ||= {});
    if (Array.isArray(headers)) {
      headers.push(["Authorization", `Basic ${encodedBasicAuthString.value}`]);
      headers.push(["Content-Type", "application/json"]);
    } else if (headers instanceof Headers) {
      headers.set("Authorization", `Basic ${encodedBasicAuthString.value}`);
      headers.set("Content-Type", "application/json");
    } else {
      headers.Authorization = `Basic ${encodedBasicAuthString.value}`;
      headers.ContentType = "application/json";
    }
  },
  onRequestError({ request, options, error }) {
    toast.add({
      id: "requesterror",
      title: "Request error.",
      description: error.message,
      icon: "i-heroicons-exclamation-circle",
      timeout: 3000,
    });
  },
  onResponseError({ request, options, error }) {
    toast.add({
      id: "responseerror",
      title: "Response error.",
      description: error?.message,
      icon: "i-heroicons-exclamation-circle",
      timeout: 3000,
    });
  },
});

const { data: iterationsData } = await useFetch<
  GenericResponse<TeamSettingsIteration>
>(iterationsURL, {
  $fetch: customFetch,
});

const iterationDates = ref({
  start: sub(new Date(), { days: 14 }),
  end: new Date(),
});

const selectedIterations = computed(
  () =>
    iterationsData.value?.value.filter(
      (v) =>
        (new Date(new Date(v.attributes.finishDate).toDateString()) >=
          new Date(iterationDates.value.start.toDateString()) &&
          new Date(new Date(v.attributes.finishDate).toDateString()) <=
            new Date(iterationDates.value.end.toDateString())) ||
        (new Date(new Date(v.attributes.startDate).toDateString()) >=
          new Date(iterationDates.value.start.toDateString()) &&
          new Date(new Date(v.attributes.startDate).toDateString()) <=
            new Date(iterationDates.value.end.toDateString())),
    ) ?? [],
);

const workItems = useState<WorkItem[]>("workItems", () => []);

watch(selectedIterations, async () => {
  if (selectedIterations.value.length === 0) return;

  toast.add({
    id: "fetchling_workiteminfo",
    title: "Fetching work item information for iterations",
    description: "",
    icon: "i-octicon-desktop-download-24",
    timeout: 3000,
  });

  const iterationWorkItemsResponse = await Promise.all(
    selectedIterations.value.map((i) =>
      customFetch<IterationWorkItems>(getIterationWorkItemsURL(i.id)),
    ),
  );

  toast.add({
    id: "fetchling_workitems",
    title: "Fetching work items",
    description: "",
    icon: "i-octicon-desktop-download-24",
    timeout: 3000,
  });

  const chunks = chunkArray(
    iterationWorkItemsResponse
      .flatMap((i) => i.workItemRelations)
      .map((r) => r.target.id),
    200,
  );

  const workItemsResponse = await Promise.all(
    chunks.map((c) =>
      customFetch<GenericResponse<WorkItem>>(workItemURL, {
        body: {
          ids: c,
          fields: [
            "System.Id",
            "System.Title",
            "System.AssignedTo",
            "Microsoft.VSTS.Scheduling.Effort",
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
          ],
        },
        method: "POST",
      }),
    ),
  );

  workItems.value = workItemsResponse.flatMap((r) => r.value);
});
</script>
<template>
  <div class="p-8 flex flex-col bg-gray-800">
    <h3 class="mb-8 text-center text-2xl font-bold">Data Selection</h3>

    <div class="flex flex-col gap-8">
      <div class="flex flex-col gap-2">
        <span>Iterations:</span>
        <div class="grid grid-cols-2 gap-2">
          <DateRangePicker v-model="iterationDates" />
          <USelectMenu :options="selectedIterations" multiple>
            <template #label>
              <span>{{ selectedIterations.length }} iterations selected</span>
            </template>
            <template #option="{ option }: { option: TeamSettingsIteration }">
              <span>{{ option.name }} </span>
            </template>
          </USelectMenu>
        </div>
      </div>
    </div>
  </div>
</template>
