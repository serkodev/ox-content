<script setup lang="ts">
import { ref, computed } from 'vue';

interface ApiItem {
  name: string;
  kind: string;
  description: string;
}

const props = defineProps<{
  items?: ApiItem[];
  title?: string;
}>();

const searchQuery = ref('');
const selectedKind = ref<string | null>(null);

const kinds = computed(() => {
  if (!props.items) return [];
  return [...new Set(props.items.map((item) => item.kind))];
});

const filteredItems = computed(() => {
  if (!props.items) return [];

  return props.items.filter((item) => {
    const matchesSearch =
      !searchQuery.value ||
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesKind = !selectedKind.value || item.kind === selectedKind.value;

    return matchesSearch && matchesKind;
  });
});
</script>

<template>
  <div class="api-viewer">
    <h3 v-if="title">{{ title }}</h3>

    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search API..."
        class="search-input"
      />

      <div class="kind-filters">
        <button
          :class="{ active: !selectedKind }"
          @click="selectedKind = null"
        >
          All
        </button>
        <button
          v-for="kind in kinds"
          :key="kind"
          :class="{ active: selectedKind === kind }"
          @click="selectedKind = kind"
        >
          {{ kind }}
        </button>
      </div>
    </div>

    <div class="items">
      <div v-for="item in filteredItems" :key="item.name" class="api-item">
        <div class="item-header">
          <span class="item-name">{{ item.name }}</span>
          <span :class="['item-kind', item.kind]">{{ item.kind }}</span>
        </div>
        <p class="item-description">{{ item.description }}</p>
      </div>
    </div>

    <p v-if="filteredItems.length === 0" class="no-results">
      No matching items found.
    </p>
  </div>
</template>

<style scoped>
.api-viewer {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: #fafafa;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.kind-filters {
  display: flex;
  gap: 4px;
}

.kind-filters button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.kind-filters button:hover {
  background: #f0f0f0;
}

.kind-filters button.active {
  background: #007acc;
  color: white;
  border-color: #007acc;
}

.api-item {
  padding: 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #eee;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-name {
  font-weight: 600;
  font-family: monospace;
  font-size: 14px;
}

.item-kind {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.item-kind.function {
  background: #e3f2fd;
  color: #1565c0;
}

.item-kind.class {
  background: #fce4ec;
  color: #c62828;
}

.item-kind.interface {
  background: #e8f5e9;
  color: #2e7d32;
}

.item-kind.type {
  background: #fff3e0;
  color: #ef6c00;
}

.item-description {
  color: #666;
  font-size: 13px;
  margin: 0;
}

.no-results {
  color: #999;
  text-align: center;
  padding: 24px;
}
</style>
