<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

// 获取路由和用户存储
const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  username: '',
  password: ''
})

// 错误信息
const errorMsg = ref('')
const loading = ref(false)

// 登录模式：'candidate' 或 'admin'
const loginMode = ref('')

// 设置登录模式
function setLoginMode(mode) {
  loginMode.value = mode
  errorMsg.value = ''
  
  // 如果是管理员登录，自动填入admin用户名
  if (mode === 'admin') {
    formData.username = 'admin'
  } else {
    formData.username = ''
  }
  formData.password = ''
}

// 返回选择界面
function backToSelection() {
  loginMode.value = ''
  errorMsg.value = ''
  formData.username = ''
  formData.password = ''
}

// 登录处理
async function handleLogin() {
  // 表单验证
  if (!formData.username || !formData.password) {
    errorMsg.value = '用户名和密码不能为空'
    return
  }
  
  // 重置错误信息并设置加载状态
  errorMsg.value = ''
  loading.value = true
  console.log('开始登录:', { username: formData.username, mode: loginMode.value })
  
  try {
    // 调用登录API
    const result = await window.api.auth.login(formData.username, formData.password)
    console.log('登录API返回结果:', result)
    
    if (result.success) {
      console.log('登录成功，用户信息:', result.user)
      
      // 管理员模式下，验证用户是否为admin角色
      if (loginMode.value === 'admin' && result.user.role !== 'admin') {
        console.log('非管理员账号尝试以管理员身份登录')
        errorMsg.value = '您不是管理员，无法登录管理端'
        loading.value = false
        return
      }
      
      // 考生模式下，不做角色验证，直接登录
      
      // 登录成功，保存用户信息
      console.log('保存用户信息到store')
      userStore.setUser(result.user)
      
      // 根据登录模式重定向
      if (loginMode.value === 'admin') {
        console.log('管理员登录成功，跳转到管理员页面')
        router.push('/admin/dashboard')
      } else {
        console.log('考生登录成功，跳转到考生页面')
        router.push('/candidate/exam')
      }
    } else {
      // 登录失败，显示错误信息
      console.log('登录失败:', result.message)
      errorMsg.value = result.message || '用户名或密码错误'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMsg.value = '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>智能抽题考试系统</h1>
        <p>特种设备考试管理平台</p>
      </div>
      
      <!-- 选择登录模式 -->
      <div v-if="!loginMode" class="login-selection">
        <h2>请选择登录方式</h2>
        
        <div class="selection-buttons">
          <button 
            class="btn-primary btn-block selection-btn" 
            @click="setLoginMode('candidate')"
          >
            <i class="fas fa-user"></i>
            考生登录
          </button>
          
          <button 
            class="btn-secondary btn-block selection-btn" 
            @click="setLoginMode('admin')"
          >
            <i class="fas fa-user-shield"></i>
            管理员登录
          </button>
        </div>
      </div>
      
      <!-- 登录表单 -->
      <div v-else>
        <div class="login-mode-header">
          <h2>{{ loginMode === 'admin' ? '管理员登录' : '考生登录' }}</h2>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-message">
            {{ errorMsg }}
          </div>
          
          <!-- 用户名输入 -->
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username" 
              v-model="formData.username" 
              type="text" 
              placeholder="请输入用户名"
              autocomplete="username"
              :readonly="loginMode === 'admin'"
            >
          </div>
          
          <!-- 密码输入 -->
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              id="password" 
              v-model="formData.password" 
              type="password" 
              placeholder="请输入密码"
              autocomplete="current-password"
            >
          </div>
          
          <div class="form-actions">
            <!-- 返回按钮 -->
            <button 
              type="button" 
              class="btn-outline" 
              @click="backToSelection"
            >
              返回
            </button>
            
            <!-- 登录按钮 -->
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="loading"
            >
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 页脚版权信息 -->
    <footer class="login-footer">
      <p>© {{ new Date().getFullYear() }} 智能抽题考试系统 v1.0</p>
    </footer>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-color-sidebar) 0%, #1a2a3a 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--bg-color-main);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.login-header {
  background-color: var(--primary-color);
  color: var(--text-light);
  padding: 20px;
  text-align: center;
}

.login-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.login-header p {
  margin: 8px 0 0;
  opacity: 0.8;
  font-size: 14px;
}

/* 选择登录模式样式 */
.login-selection {
  padding: 30px 24px;
  text-align: center;
}

.login-selection h2 {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-dark);
}

.selection-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selection-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.selection-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.selection-btn i {
  font-size: 18px;
}

/* 登录模式头部 */
.login-mode-header {
  padding: 15px 24px 0;
  text-align: center;
}

.login-mode-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-dark);
}

/* 登录表单样式 */
.login-form {
  padding: 20px 24px 24px;
}

.error-message {
  background-color: var(--error-bg-color);
  color: var(--error-text-color);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.form-group input[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}

.form-actions button {
  flex: 1;
}

.btn-block {
  width: 100%;
  margin-top: 8px;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-dark);
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s, border-color 0.3s;
}

.btn-outline:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.btn-secondary {
  background-color: var(--secondary-color, #6c757d);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: var(--secondary-hover-color, #5a6268);
}

.login-footer {
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-size: 14px;
}
</style>