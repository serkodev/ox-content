<script setup lang="ts">
defineProps<{
  name: string;
  description: string;
  href?: string;
  badge?: string;
}>();
</script>

<template>
  <a :href="href" class="package-card">
    <div class="card-header">
      <span class="card-name">{{ name }}</span>
      <span v-if="badge" class="card-badge">{{ badge }}</span>
    </div>
    <p class="card-description">{{ description }}</p>
  </a>
</template>

<style scoped>
.package-card {
  display: block;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  background: #fafafa;
}

.package-card:hover {
  border-color: #007acc;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-name {
  font-weight: 600;
  font-family: monospace;
  font-size: 14px;
}

.card-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  text-transform: uppercase;
}

.card-description {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}
</style>
