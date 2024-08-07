<script setup lang="ts">
import { sub, format, isSameDay, type Duration } from "date-fns";
import DatePicker from "./DatePicker.vue";

const model = defineModel<{ start: Date; end: Date }>({ required: true });

const ranges = [
  { label: "Last 7 days", duration: { days: 7 } },
  { label: "Last 14 days", duration: { days: 14 } },
  { label: "Last 30 days", duration: { days: 30 } },
  { label: "Last 3 months", duration: { months: 3 } },
  { label: "Last 6 months", duration: { months: 6 } },
  { label: "Last year", duration: { years: 1 } },
];

function isRangeModel(duration: Duration) {
  return (
    isSameDay(model.value.start, sub(new Date(), duration)) &&
    isSameDay(model.value.end, new Date())
  );
}

function selectRange(duration: Duration) {
  model.value = { start: sub(new Date(), duration), end: new Date() };
}
</script>

<template>
  <div class="flex-1">
    <UPopover>
      <UButton icon="i-heroicons-calendar-days-20-solid">
        {{ format(model.start, "d MMM, yyy") }} -
        {{ format(model.end, "d MMM, yyy") }}
      </UButton>

      <template #panel="{ close }">
        <div
          class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800"
        >
          <div class="hidden sm:flex flex-col py-4">
            <UButton
              v-for="(range, index) in ranges"
              :key="index"
              :label="range.label"
              color="gray"
              variant="ghost"
              class="rounded-none px-6"
              :class="[
                isRangeModel(range.duration)
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              ]"
              truncate
              @click="selectRange(range.duration)"
            />
          </div>

          <DatePicker v-model="model" @close="close" />
        </div>
      </template>
    </UPopover>
  </div>
</template>
