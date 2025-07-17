<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="confirm-dialog-backdrop">
        <div class="confirm-dialog" :class="{ 'danger': type === 'danger' }">
          <div class="confirm-dialog-header">
            <h3>{{ title }}</h3>
            <button class="close-button" @click="cancel">&times;</button>
          </div>
          
          <div class="confirm-dialog-body">
            <p>{{ message }}</p>
          </div>
          
          <div class="confirm-dialog-footer">
            <button 
              class="btn btn-secondary" 
              @click="cancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button 
              class="btn" 
              :class="type === 'danger' ? 'btn-danger' : 'btn-primary'" 
              @click="confirm"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner-small"></span>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '确认'
  },
  message: {
    type: String,
    default: '确定要执行此操作吗？'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'danger'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.confirm-dialog {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.confirm-dialog-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

.confirm-dialog-body {
  padding: 16px;
}

.confirm-dialog-body p {
  margin: 0;
  color: var(--text-normal);
}

.confirm-dialog-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.loading-spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .confirm-dialog,
.fade-leave-active .confirm-dialog {
  transition: transform 0.3s;
}

.fade-enter-from .confirm-dialog,
.fade-leave-to .confirm-dialog {
  transform: scale(0.9);
}
</style>