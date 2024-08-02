<script lang="ts" setup>
import type {
  DataRow,
  GitRepository,
  WorkItem,
  WorkItemQueryResult,
  WorkItemResponse,
} from "~/types";

const organization = "BARKFORS";
const project = "T5";
const team = "T5%20Team";

const PAT = "kef542l4mkpf25fj3ytn64ykdwr3bbqntjyvywwyrv3ibzbs2tca";
const computedPAT = computed(() => btoa(`:${PAT}`));
const baseURL = `https://dev.azure.com/${organization}/${project}`;

const repoURL = "/_apis/git/repositories";
const wiqlURL = `/${team}/_apis/wit/wiql?api-version=7.2-preview.2`;
const workItemURL = "/_apis/wit/workitemsbatch?api-version=7.2-preview.1";

const customFetch = $fetch.create({
  baseURL: baseURL,
  onRequest({ request, options }) {
    const headers = (options.headers ||= {});
    if (Array.isArray(headers)) {
      headers.push(["Authorization", `Basic ${computedPAT.value}`]);
      headers.push(["Content-Type", "application/json"]);
    } else if (headers instanceof Headers) {
      headers.set("Authorization", `Basic ${computedPAT.value}`);
      headers.set("Content-Type", "application/json");
    } else {
      headers.Authorization = `Basic ${computedPAT.value}`;
      headers.ContentType = "application/json";
    }
  },
});

const items: Ref<WorkItem[]> = ref([]);

const selectedRepo: Ref<GitRepository | undefined> = ref(undefined);

const {
  data: repoData,
}: { data: Ref<{ count: number; value: GitRepository[] } | null> } =
  await useFetch(repoURL, {
    $fetch: customFetch,
  });

await useFetch(wiqlURL, {
  $fetch: customFetch,
  method: "POST",
  body: {
    query: "SELECT [System.Id] FROM WorkItems WHERE [System.State] <> 'Closed'",
  },
  async onResponse({ request, response, options }) {
    const res: WorkItemQueryResult = response._data;
    const chunks = chunkArray(res.workItems, 200);
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

const repositories = computed(() => repoData?.value?.value ?? []);

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
    sortable: true
  },
  {
    key: "averageEffort",
    label: "Average Effort",
    sortable: true
  }
];

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
      originalEstimate: +i.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"] as number,
      count: 1,
      averageEffort:  +i.fields["Microsoft.VSTS.Scheduling.Effort"] as number,
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
      acc.push({ name, effort: effort, originalEstimate: originalEstimate, count: 1, averageEffort: effort });
    }
    return acc;
  }, [] as DataRow[]),
);
</script>
<template>
  <div>
    <USelectMenu v-model="selectedRepo" :options="repositories">
      <template #label>
        <span v-if="selectedRepo" class="truncate">{{
          selectedRepo.name
        }}</span>
        <span v-else>Select repository</span>
      </template>
      <template #option="{ option: repo }">
        <span aria-hidden="true" />
        <span class="truncate">{{ repo.name }}</span>
      </template>
    </USelectMenu>
    <UTable :columns="columns" :rows="groupedByEffort" />
  </div>
</template>
