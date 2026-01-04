<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="editor-container">
    <div class="editor-header">
      <span>Markdown</span>
    </div>
    <textarea
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      class="editor"
      placeholder="Enter Markdown here..."
      spellcheck="false"
    />
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  background: #16213e;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  padding: 12px 16px;
  background: #0f3460;
  font-weight: 600;
  color: #e94560;
}

.editor {
  flex: 1;
  padding: 16px;
  background: transparent;
  border: none;
  color: #eee;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.editor::placeholder {
  color: #555;
}
</style>
