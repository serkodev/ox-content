<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title?: string;
  language?: string;
}>();

const showCode = ref(false);
</script>

<template>
  <div class="code-demo">
    <div class="demo-header">
      <span v-if="title" class="demo-title">{{ title }}</span>
      <button @click="showCode = !showCode" class="toggle-btn">
        {{ showCode ? 'Hide Code' : 'Show Code' }}
      </button>
    </div>

    <div class="demo-preview">
      <slot name="preview" />
    </div>

    <div v-if="showCode" class="demo-code">
      <slot name="code" />
    </div>
  </div>
</template>

<style scoped>
.code-demo {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.demo-title {
  font-weight: 500;
  font-size: 14px;
}

.toggle-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toggle-btn:hover {
  background: #005a9e;
}

.demo-preview {
  padding: 24px;
  background: white;
}

.demo-code {
  border-top: 1px solid #e0e0e0;
  background: #1e1e1e;
}

.demo-code :deep(pre) {
  margin: 0;
  padding: 16px;
}
</style>
