<script lang="ts" setup>
const links = [
  {
    label: "Documentation",
    icon: "i-heroicons-book-open",
    to: "/getting-started",
  },
  {
    label: "Playground",
    icon: "i-simple-icons-stackblitz",
    to: "/playground",
  },
  {
    label: "Roadmap",
    icon: "i-heroicons-map",
    to: "/roadmap",
  },
  {
    label: "Pro",
    icon: "i-heroicons-square-3-stack-3d",
    to: "/pro",
  },
  {
    label: "Releases",
    icon: "i-heroicons-rocket-launch",
    to: "https://github.com/nuxt/ui/releases",
    target: "_blank",
  },
];
</script>
<template>
  <UPage class="flex-1">
    <UPageHeader
      headline="Login"
      title="DevOps BI"
      description="Enter your Azure DevOps Personal Access Token (PAT) to continue."
    />
    <template #left>
      <UAside :links="links">
        <UNavigationTree :links="[]" default-open :multiple="false" />
      </UAside>
    </template>
    <UPageBody></UPageBody>
  </UPage>
</template>
