<script lang="ts" setup>
import type {
  DataRow,
  WorkItem,
} from "~/types";

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
  {
    key: "averageOriginalEstimate",
    label: "Average Original Estimate",
    sortable: true,
  },
  {
    key: "effortEstimateRatio",
    label: "Ratio (Effort/Original Estimate)",
    sortable: true,
  },
];
const items = useState<WorkItem[]>("workItems", () => []);

const tableRows: ComputedRef<DataRow[]> = computed(() =>
  items.value
    .filter(
      (i) =>
        "Microsoft.VSTS.Scheduling.Effort" in i.fields &&
        "Microsoft.VSTS.Scheduling.OriginalEstimate" in i.fields &&
        "System.AssignedTo" in i.fields,
    )
    .map((i) => {
      const effort = +i.fields["Microsoft.VSTS.Scheduling.Effort"];
      const originalEstimate =
        +i.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"];
      return {
        name: i.fields["System.AssignedTo"].displayName as string,
        effort: effort,
        originalEstimate: originalEstimate,
        count: 1,
        averageEffort: effort,
        averageOriginalEstimate: originalEstimate,
        effortEstimateRatio: effort / originalEstimate,
      } as DataRow;
    }),
);

const groupedByEffort = computed(() =>
  tableRows.value
    .reduce((acc, { effort, originalEstimate, name }) => {
      const existing = acc.find((x) => x.name === name);
      if (existing) {
        existing.effort += +effort;
        existing.originalEstimate += originalEstimate;
        existing.count++;
        existing.averageEffort = existing.effort / existing.count;
        existing.averageOriginalEstimate =
          existing.originalEstimate / existing.count;
        existing.effortEstimateRatio =
          existing.averageEffort / existing.averageOriginalEstimate;
      } else {
        acc.push({
          name,
          effort: effort,
          originalEstimate: originalEstimate,
          count: 1,
          averageEffort: effort,
          averageOriginalEstimate: originalEstimate,
          effortEstimateRatio: effort / originalEstimate,
        });
      }
      return acc;
    }, [] as DataRow[])
    .map(
      (dr) =>
        ({
          name: dr.name,
          effort: Math.round(10 * dr.effort) / 10,
          originalEstimate: dr.originalEstimate,
          count: dr.count,
          averageEffort: Math.round(10 * dr.averageEffort) / 10,
          averageOriginalEstimate:
            Math.round(10 * dr.averageOriginalEstimate) / 10,
          effortEstimateRatio: Math.round(10 * dr.effortEstimateRatio) / 10,
        }) as DataRow,
    ),
);
</script>
<template>
  <div class="flex-1 p-8 flex-col gap-4 flex items-center">
    <UTable class="w-full" :columns="columns" :rows="groupedByEffort" />
  </div>
</template>
