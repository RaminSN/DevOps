<script lang="ts" setup>
import type {
  DataRow,
  WorkItem,
  WorkItemQueryResult,
  WorkItemResponse,
} from "~/types";

function setup() {
  useState("isSetupOpen").value = true;
}

const toast = useToast();

const organization = computed(
  () =>
    useState("organization").value,
);
const project = computed(
  () => useState("project").value,
);
const team = computed(
  () => useState("team").value,
);
const PAT = computed(
  () => useState("PAT").value,
);

const encodedBasicAuthString = computed(() => {
  return btoa(`:${PAT.value}`);
});

const baseURL = computed(
  () => `https://dev.azure.com/${organization.value}/${project.value}`,
);

const repoURL = "/_apis/git/repositories";
const wiqlURL = `/${team.value}/_apis/wit/wiql?api-version=7.2-preview.2`;
const workItemURL = "/_apis/wit/workitemsbatch?api-version=7.2-preview.1";

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
      id: "error",
      title: "Request error.",
      description: error.message,
      icon: "i-heroicons-exclamation-circle",
      timeout: 3000,
    });
  },
});

function fetch() {
  toast.add({
    id: "fetching_workitems",
    title: "Fetching work items.",
    description: "",
    icon: "i-octicon-desktop-download-24",
    timeout: 3000,
  });

  customFetch(wiqlURL, {
    method: "POST",
    body: {
      query:
        "SELECT [System.Id] FROM WorkItems WHERE [System.State] <> 'Closed'",
    },
    async onResponse({ request, response, options }) {
      const res: WorkItemQueryResult = response._data;
      const chunks = chunkArray(res.workItems, 200);
      toast.add({
        id: "fetching_fielddata",
        title: "Fetching field data.",
        description: "",
        icon: "i-octicon-desktop-download-24",
        timeout: 3000,
      });
      for (const chunk of chunks) {
        const ids = chunk.map((c) => c.id);
        customFetch<WorkItemResponse>(workItemURL, {
          body: {
            ids: ids,
            fields: [
              "System.Id",
              "System.Title",
              "System.AssignedTo",
              "Microsoft.VSTS.Scheduling.Effort",
              "Microsoft.VSTS.Scheduling.OriginalEstimate",
            ],
          },
          method: "POST",
        }).then((val) => items.value.push(...val.value));
      }
    },
  });
}

const columns = [
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key: "effort",
    label: "Effort",
    sortable: true,
  },
  {
    key: "originalEstimate",
    label: "Original Estimate",
    sortable: true,
  },
  {
    key: "count",
    label: "Item Count",
    sortable: true,
  },
  {
    key: "averageEffort",
    label: "Average Effort",
    sortable: true,
  },
];
const items: Ref<WorkItem[]> = ref([]);

const tableRows: ComputedRef<DataRow[]> = computed(() =>
  items.value
    .filter(
      (i) =>
        "Microsoft.VSTS.Scheduling.Effort" in i.fields &&
        "Microsoft.VSTS.Scheduling.OriginalEstimate" in i.fields &&
        "System.AssignedTo" in i.fields,
    )
    .map((i) => ({
      name: i.fields["System.AssignedTo"].displayName as string,
      effort: +i.fields["Microsoft.VSTS.Scheduling.Effort"] as number,
      originalEstimate: +i.fields[
        "Microsoft.VSTS.Scheduling.OriginalEstimate"
      ] as number,
      count: 1,
      averageEffort: +i.fields["Microsoft.VSTS.Scheduling.Effort"] as number,
    })),
);

const groupedByEffort = computed(() =>
  tableRows.value.reduce((acc, { effort, originalEstimate, name }) => {
    const existing = acc.find((x) => x.name === name);
    if (existing) {
      existing.effort += +effort;
      existing.originalEstimate += originalEstimate;
      existing.count++;
      existing.averageEffort = existing.effort / existing.count;
    } else {
      acc.push({
        name,
        effort: effort,
        originalEstimate: originalEstimate,
        count: 1,
        averageEffort: effort,
      });
    }
    return acc;
  }, [] as DataRow[]),
);
</script>
<template>
  <div class="flex-1 p-8 flex-col gap-4 flex items-center">
    <UButton @click="fetch">Load Data</UButton>
    <UTable class="w-full" :columns="columns" :rows="groupedByEffort" />
  </div>
</template>
