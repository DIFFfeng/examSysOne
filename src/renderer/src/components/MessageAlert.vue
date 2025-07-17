<template>
  <transition name="fade">
    <div v-if="visible" class="message-alert" :class="type">
      <div class="message-content">
        {{ message }}
      </div>
      <button v-if="dismissible" class="close-button" @click="close">
        &times;
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000 // 默认显示3秒
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  autoClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timer = null

// 关闭消息
function close() {
  visible.value = false
  emit('close')
  clearTimeout(timer)
}

// 监听消息变化，重置计时器
watch(() => props.message, (newVal) => {
  if (newVal) {
    visible.value = true
    resetTimer()
  }
})

// 重置自动关闭计时器
function resetTimer() {
  clearTimeout(timer)
  if (props.autoClose && props.duration > 0) {
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

onMounted(() => {
  if (props.message) {
    visible.value = true
    resetTimer()
  }
})
</script>

<style scoped>
.message-alert {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1100;
}

.message-content {
  flex: 1;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  padding: 0 0 0 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

/* 消息类型样式 */
.info {
  background-color: var(--info-bg-color);
  color: var(--info-text-color);
  border-left: 4px solid var(--info-color);
}

.success {
  background-color: var(--success-bg-color);
  color: var(--success-text-color);
  border-left: 4px solid var(--success-color);
}

.warning {
  background-color: var(--warning-bg-color);
  color: var(--warning-text-color);
  border-left: 4px solid var(--warning-color);
}

.error {
  background-color: var(--error-bg-color);
  color: var(--error-text-color);
  border-left: 4px solid var(--error-color);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>