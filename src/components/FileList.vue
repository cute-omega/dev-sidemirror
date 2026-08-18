<script setup>
import FileCard from './FileCard.vue'

defineProps({
  assets: { type: Array, default: () => [] },
  version: { type: String, required: true },
  recommendedFile: { type: Object, default: null },
  targetOS: { type: String, default: null },
  targetArch: { type: String, default: null },
})
</script>

<template>
  <div class="space-y-2">
    <FileCard
      v-for="asset in assets"
      :key="asset.name"
      :asset="asset"
      :version="version"
      :isRecommended="recommendedFile?.name === asset.name"
      :targetOS="targetOS"
      :targetArch="targetArch"
    />
  </div>
</template>
