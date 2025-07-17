<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

// 获取用户存储和路由器
const userStore = useUserStore()
const router = useRouter()

// 页面状态
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// 考生信息
const candidateName = ref('')
const candidateIdCard = ref('')
const examInfo = ref(null)

// 生命周期钩子
onMounted(() => {
  // 获取当前登录的考生信息
  if (userStore.user) {
    candidateName.value = userStore.user.username
    candidateIdCard.value = userStore.user.idCard
    
    // 查找考生的考试信息
    checkExamInfo()
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

// 检查考生的考试信息
async function checkExamInfo() {
  if (!candidateIdCard.value) return
  
  loading.value = true
  
  try {
    // 获取所有考生信息
    const candidates = await window.api.candidates.getAll()
    
    // 查找当前考生
    const candidate = candidates.find(c => c.idCard === candidateIdCard.value)
    
    if (candidate) {
      examInfo.value = {
        projectName: candidate.projectName,
        status: 'ready' // 可以是 'ready', 'in_progress', 'completed'
      }
    }
  } catch (error) {
    console.error('获取考试信息失败:', error)
    showMessage('获取考试信息失败', 'error')
  } finally {
    loading.value = false
  }
}

// 开始考试
function startExam() {
  if (!examInfo.value) {
    showMessage('没有可用的考试信息', 'error')
    return
  }
  
  // 查找项目ID
  loading.value = true
  
  window.api.projects.getAll()
    .then(projects => {
      const project = projects.find(p => p.name === examInfo.value.projectName)
      
      if (project) {
        // 导航到考试页面，传递必要的参数
        router.push({
          name: 'exam-paper',
          query: {
            projectId: project.id,
            candidateName: candidateName.value,
            candidateIdCard: candidateIdCard.value
          }
        })
      } else {
        showMessage('找不到对应的考试项目', 'error')
      }
    })
    .catch(error => {
      console.error('获取项目信息失败:', error)
      showMessage('获取项目信息失败', 'error')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="welcome-container">
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <div class="welcome-card">
      <div class="welcome-header">
        <h1>欢迎参加考试</h1>
      </div>
      
      <div class="candidate-info">
        <div class="info-item">
          <span class="info-label">考生姓名：</span>
          <span class="info-value">{{ candidateName }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">身份证号：</span>
          <span class="info-value">{{ candidateIdCard }}</span>
        </div>
      </div>
      
      <div v-if="examInfo" class="exam-info">
        <div class="info-item">
          <span class="info-label">考试项目：</span>
          <span class="info-value">{{ examInfo.projectName }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">考试状态：</span>
          <span class="info-value status-ready">准备就绪</span>
        </div>
      </div>
      
      <div v-else class="no-exam-info">
        <p>暂无考试信息，请联系考试管理员</p>
      </div>
      
      <div class="action-buttons">
        <button 
          v-if="examInfo" 
          class="btn-primary" 
          @click="startExam" 
          :disabled="loading"
        >
          开始考试
        </button>
      </div>
      
      <div class="exam-instructions">
        <h2>考试须知</h2>
        <ul>
          <li>请确认您的个人信息无误</li>
          <li>考试过程中请勿刷新页面或关闭窗口</li>
          <li>考试完成后，请点击"保存并打印"按钮</li>
          <li>如有疑问，请联系现场考试管理员</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
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

.welcome-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 30px;
}

.welcome-header h1 {
  font-size: 28px;
  color: var(--primary-color);
  margin: 0;
}

.candidate-info,
.exam-info {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 100px;
  font-weight: 500;
  color: var(--text-muted);
}

.info-value {
  flex: 1;
  font-weight: 500;
}

.status-ready {
  color: #28a745;
}

.no-exam-info {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.btn-primary {
  padding: 12px 30px;
  font-size: 16px;
}

.exam-instructions {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.exam-instructions h2 {
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-dark);
}

.exam-instructions ul {
  padding-left: 20px;
  margin: 0;
}

.exam-instructions li {
  margin-bottom: 8px;
  color: var(--text-muted);
}
</style>