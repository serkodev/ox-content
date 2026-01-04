<script setup lang="ts">
import { ref } from 'vue';

interface Param {
  name: string;
  type: string;
  description: string;
}

const props = defineProps<{
  name: string;
  description?: string;
  params?: Param[];
  returnType?: string;
  returnDescription?: string;
  example?: string;
}>();

const showExample = ref(false);
</script>

<template>
  <div class="function-card">
    <div class="card-header">
      <code class="function-name">{{ name }}</code>
      <span class="badge">function</span>
    </div>

    <p v-if="description" class="description">{{ description }}</p>

    <div v-if="params && params.length > 0" class="params">
      <h4>Parameters</h4>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in params" :key="param.name">
            <td><code>{{ param.name }}</code></td>
            <td><code class="type">{{ param.type }}</code></td>
            <td>{{ param.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="returnType" class="returns">
      <h4>Returns</h4>
      <p>
        <code class="type">{{ returnType }}</code>
        <span v-if="returnDescription"> - {{ returnDescription }}</span>
      </p>
    </div>

    <div v-if="example" class="example">
      <button @click="showExample = !showExample" class="toggle-btn">
        {{ showExample ? 'Hide Example' : 'Show Example' }}
      </button>
      <pre v-if="showExample"><code>{{ example }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.function-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fb 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.function-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.badge {
  font-size: 10px;
  padding: 3px 8px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 500;
}

.description {
  color: #555;
  margin-bottom: 16px;
}

.params h4,
.returns h4 {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  padding: 8px;
  background: #f0f0f0;
  font-weight: 500;
}

td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.type {
  color: #0066cc;
  background: #e8f4fc;
  padding: 1px 4px;
  border-radius: 3px;
}

.returns {
  margin-top: 12px;
}

.example {
  margin-top: 16px;
}

.toggle-btn {
  padding: 6px 12px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.toggle-btn:hover {
  background: #005a9e;
}

pre {
  margin-top: 12px;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
}
</style>
