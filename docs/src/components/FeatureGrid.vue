<script setup lang="ts">
interface Feature {
  icon: string;
  title: string;
  description: string;
}

defineProps<{
  features: Feature[];
}>();
</script>

<template>
  <div class="feature-grid">
    <div v-for="feature in features" :key="feature.title" class="feature">
      <span class="feature-icon">{{ feature.icon }}</span>
      <h3 class="feature-title">{{ feature.title }}</h3>
      <p class="feature-description">{{ feature.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin: 24px 0;
}

.feature {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  border-radius: 12px;
  text-align: center;
}

.feature-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.feature-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.feature-description {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
</style>
