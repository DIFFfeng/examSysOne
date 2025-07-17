<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user'

// 获取路由参数和用户存储
const route = useRoute()
const userStore = useUserStore()

// 页面状态
const loading = ref(true)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'
const isPrinting = ref(false)

// 考试信息
const examInfo = ref({
  projectName: '',
  candidateName: '',
  candidateIdCard: '',
  examDate: new Date().toLocaleDateString('zh-CN'),
  questions: [],
  totalScore: 0
})

// 分数输入
const scores = ref([])

// 计算总分
const totalScore = computed(() => {
  if (!scores.value.length) return 0
  return scores.value.reduce((sum, score) => sum + (parseFloat(score) || 0), 0)
})

// 生命周期钩子
onMounted(async () => {
  // 从路由参数获取考试信息
  const { projectId, candidateName, candidateIdCard } = route.query
  
  if (!projectId || !candidateName || !candidateIdCard) {
    showMessage('缺少必要的考试信息', 'error')
    loading.value = false
    return
  }
  
  try {
    // 获取考生信息
    examInfo.value.candidateName = candidateName
    examInfo.value.candidateIdCard = candidateIdCard
    
    // 获取项目信息
    const projectResult = await window.api.projects.getById(projectId)
    if (projectResult && projectResult.success) {
      examInfo.value.projectName = projectResult.data.name
    }
    
    // 获取抽题结果
    const drawResult = await window.api.questions.drawQuestions(projectId)
    if (drawResult && drawResult.success) {
      examInfo.value.questions = drawResult.data
      // 初始化分数数组
      scores.value = Array(examInfo.value.questions.length).fill('')
    } else {
      showMessage('获取试题失败', 'error')
    }
  } catch (error) {
    console.error('加载考试信息失败:', error)
    showMessage('加载考试信息失败', 'error')
  } finally {
    loading.value = false
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

// 打印试卷
async function printExamPaper() {
  isPrinting.value = true
  
  try {
    // 调用打印功能
    await window.api.utils.printWindow()
    showMessage('打印成功')
  } catch (error) {
    console.error('打印失败:', error)
    showMessage('打印失败', 'error')
  } finally {
    isPrinting.value = false
  }
}

// 保存考试结果
async function saveExamResult() {
  // 检查是否所有题目都已评分
  const hasEmptyScores = scores.value.some(score => score === '')
  if (hasEmptyScores) {
    showMessage('请为所有题目评分', 'error')
    return
  }
  
  loading.value = true
  
  try {
    // 构建考试结果数据
    const examResult = {
      projectName: examInfo.value.projectName,
      candidateName: examInfo.value.candidateName,
      candidateIdCard: examInfo.value.candidateIdCard,
      examDate: examInfo.value.examDate,
      totalScore: totalScore.value,
      questions: examInfo.value.questions.map((question, index) => ({
        id: question.id,
        content: question.content,
        score: parseFloat(scores.value[index]) || 0
      }))
    }
    
    // 调用保存结果API（这里假设有这个API，实际需要根据需求实现）
    // const result = await window.api.exam.saveResult(examResult)
    
    // 模拟保存成功
    showMessage('考试结果已保存')
    
    // 打印试卷
    await printExamPaper()
  } catch (error) {
    console.error('保存考试结果失败:', error)
    showMessage('保存考试结果失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="exam-paper-container">
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 考试试卷 -->
    <div class="exam-paper" id="exam-paper-print">
      <!-- 试卷头部 -->
      <div class="exam-header">
        <h1 class="exam-title">{{ examInfo.projectName }}考试试卷</h1>
        
        <div class="exam-info">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">考生姓名：</span>
              <span class="info-value">{{ examInfo.candidateName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">身份证号：</span>
              <span class="info-value">{{ examInfo.candidateIdCard }}</span>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">考试日期：</span>
              <span class="info-value">{{ examInfo.examDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总分：</span>
              <span class="info-value total-score">{{ totalScore }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 试题列表 -->
      <div class="questions-container">
        <div v-if="examInfo.questions.length === 0" class="no-questions">
          暂无试题
        </div>
        
        <div v-else class="question-list">
          <div 
            v-for="(question, index) in examInfo.questions" 
            :key="question.id"
            class="question-item"
          >
            <div class="question-header">
              <div class="question-number">第 {{ index + 1 }} 题</div>
              <div class="question-score">
                <span class="score-label">得分：</span>
                <input 
                  v-model="scores[index]" 
                  type="number" 
                  class="score-input" 
                  min="0" 
                  max="100"
                  step="0.5"
                  @input="$event.target.value = $event.target.value.replace(/[^\d.]/g, '')"
                >
              </div>
            </div>
            
            <div class="question-content">
              {{ question.content }}
            </div>
            
            <!-- 如果有图片，显示图片 -->
            <div v-if="question.imageUrl" class="question-image">
              <img :src="`file://${question.imageUrl}`" alt="题目图片">
            </div>
          </div>
        </div>
      </div>
      
      <!-- 评分区域 -->
      <div class="scoring-section">
        <div class="signature-area">
          <div class="signature-line">
            <span class="signature-label">考官签名：</span>
            <span class="signature-value"></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button 
        class="btn-primary" 
        @click="saveExamResult" 
        :disabled="loading || isPrinting"
      >
        保存并打印
      </button>
      
      <button 
        class="btn-secondary" 
        @click="printExamPaper" 
        :disabled="loading || isPrinting"
      >
        仅打印
      </button>
    </div>
  </div>
</template>

<style scoped>
.exam-paper-container {
  padding: 20px;
  max-width: 210mm; /* A4宽度 */
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

.exam-paper {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.exam-header {
  margin-bottom: 30px;
  text-align: center;
}

.exam-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: 500;
  margin-right: 5px;
}

.total-score {
  font-weight: bold;
  font-size: 18px;
  color: var(--primary-color);
}

.questions-container {
  margin-bottom: 30px;
}

.no-questions {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-number {
  font-weight: 500;
  color: var(--primary-color);
}

.question-score {
  display: flex;
  align-items: center;
}

.score-label {
  margin-right: 5px;
}

.score-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: center;
}

.question-content {
  margin-bottom: 10px;
  line-height: 1.6;
}

.question-image {
  margin-top: 10px;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid var(--border-color);
}

.scoring-section {
  margin-top: 30px;
}

.signature-area {
  margin-top: 50px;
}

.signature-line {
  display: flex;
  margin-bottom: 10px;
}

.signature-label {
  margin-right: 10px;
}

.signature-value {
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

/* 打印样式 */
@media print {
  .exam-paper-container {
    padding: 0;
  }
  
  .message,
  .action-buttons {
    display: none;
  }
  
  .exam-paper {
    border: none;
    box-shadow: none;
    padding: 0;
    margin: 0;
  }
  
  .question-item {
    page-break-inside: avoid;
  }
  
  .score-input {
    border: 1px solid #000;
  }
  
  /* 强制分页设置 */
  @page {
    size: A4;
    margin: 1cm;
  }
}
</style>