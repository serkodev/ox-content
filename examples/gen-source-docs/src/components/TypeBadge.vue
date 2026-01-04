<script setup lang="ts">
const props = defineProps<{
  type: string;
  variant?: 'default' | 'function' | 'class' | 'interface' | 'type' | 'variable';
}>();
</script>

<template>
  <span :class="['type-badge', variant || 'default']">
    {{ type }}
  </span>
</template>

<style scoped>
.type-badge {
  display: inline-block;
  font-family: monospace;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.type-badge.default {
  background: #f0f0f0;
  color: #333;
}

.type-badge.function {
  background: #e3f2fd;
  color: #1565c0;
}

.type-badge.class {
  background: #fce4ec;
  color: #c62828;
}

.type-badge.interface {
  background: #e8f5e9;
  color: #2e7d32;
}

.type-badge.type {
  background: #fff3e0;
  color: #ef6c00;
}

.type-badge.variable {
  background: #f3e5f5;
  color: #7b1fa2;
}
</style>
