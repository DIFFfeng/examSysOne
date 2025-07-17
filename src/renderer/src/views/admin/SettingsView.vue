<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/user'

// 获取用户存储
const userStore = useUserStore()

// 页面状态
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// 表单数据
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settingsForm = ref({
  defaultQuestionCount: 10
})

// 计算属性：获取当前用户名
const username = computed(() => userStore.user?.username || '')

// 生命周期钩子
onMounted(() => {
  // 初始化设置表单
  if (userStore.user && userStore.user.settings) {
    settingsForm.value.defaultQuestionCount = userStore.user.settings.defaultQuestionCount || 10
  }
})

// 显示消息
function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  
  // 3秒后自动清除消息
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 3000)
}

// 更新密码
async function updatePassword() {
  // 表单验证
  if (!passwordForm.value.currentPassword) {
    showMessage('请输入当前密码', 'error')
    return
  }
  
  if (!passwordForm.value.newPassword) {
    showMessage('请输入新密码', 'error')
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showMessage('两次输入的新密码不一致', 'error')
    return
  }
  
  loading.value = true
  
  try {
    const result = await window.api.auth.updatePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    )
    
    if (result.success) {
      showMessage('密码更新成功')
      // 清空表单
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      showMessage(result.message || '密码更新失败', 'error')
    }
  } catch (error) {
    console.error('更新密码失败:', error)
    showMessage('更新密码失败', 'error')
  } finally {
    loading.value = false
  }
}

// 更新设置
async function updateSettings() {
  // 表单验证
  if (settingsForm.value.defaultQuestionCount < 1) {
    showMessage('默认抽题数量必须大于0', 'error')
    return
  }
  
  loading.value = true
  
  try {
    const result = await window.api.settings.update(settingsForm.value)
    
    if (result.success) {
      // 更新本地用户设置
      userStore.updateSettings(settingsForm.value)
      showMessage('设置更新成功')
    } else {
      showMessage('设置更新失败', 'error')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    showMessage('更新设置失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-container">
    <h1 class="page-title">用户设置</h1>
    
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <div class="row">
      <!-- 修改密码 -->
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-header">
            <h2>修改密码</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="updatePassword">
              <div class="form-group">
                <label for="current-password">当前密码</label>
                <input 
                  id="current-password" 
                  v-model="passwordForm.currentPassword" 
                  type="password" 
                  class="form-control" 
                  placeholder="请输入当前密码"
                >
              </div>
              
              <div class="form-group">
                <label for="new-password">新密码</label>
                <input 
                  id="new-password" 
                  v-model="passwordForm.newPassword" 
                  type="password" 
                  class="form-control" 
                  placeholder="请输入新密码"
                >
              </div>
              
              <div class="form-group">
                <label for="confirm-password">确认新密码</label>
                <input 
                  id="confirm-password" 
                  v-model="passwordForm.confirmPassword" 
                  type="password" 
                  class="form-control" 
                  placeholder="请再次输入新密码"
                >
              </div>
              
              <button type="submit" class="btn-primary" :disabled="loading">
                更新密码
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- 系统设置 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h2>系统设置</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="updateSettings">
              <div class="form-group">
                <label for="default-question-count">默认抽题数量</label>
                <input 
                  id="default-question-count" 
                  v-model.number="settingsForm.defaultQuestionCount" 
                  type="number" 
                  class="form-control" 
                  min="1"
                  max="100"
                >
                <small class="form-text text-muted">
                  设置开始考试时默认抽取的题目数量
                </small>
              </div>
              
              <button type="submit" class="btn-primary" :disabled="loading">
                保存设置
              </button>
            </form>
          </div>
        </div>
        
        <!-- 用户信息卡片 -->
        <div class="card mt-4">
          <div class="card-header">
            <h2>账户信息</h2>
          </div>
          <div class="card-body">
            <div class="user-info-item">
              <div class="info-label">用户名</div>
              <div class="info-value">{{ username }}</div>
            </div>
            
            <div class="user-info-item">
              <div class="info-label">角色</div>
              <div class="info-value">管理员</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
  color: var(--text-dark);
}

.message {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
}

.message.success {
  background-color: var(--success-bg-color);
  color: var(--success-text-color);
}

.message.error {
  background-color: var(--error-bg-color);
  color: var(--error-text-color);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
}

.col-md-6 {
  flex: 0 0 50%;
  max-width: 50%;
  padding: 0 12px;
}

@media (max-width: 768px) {
  .col-md-6 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.mb-4 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 24px;
}

.form-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.user-info-item {
  display: flex;
  margin-bottom: 12px;
}

.user-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  color: var(--text-muted);
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-weight: 500;
}
</style>