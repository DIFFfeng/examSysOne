<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useProjectStore } from '../../stores/project'
import { useQuestionStore } from '../../stores/question'
import { useCandidateStore } from '../../stores/candidate'

// 获取路由和存储
const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()
const questionStore = useQuestionStore()
const candidateStore = useCandidateStore()

// 页面状态
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// 手动添加考生表单
const candidateForm = ref({
  name: '',
  idCard: '',
  projectName: ''
})

// 选中的项目ID
const selectedProjectId = ref('')

// 计算属性：获取活跃项目列表
const activeProjects = computed(() => projectStore.activeProjects)

// 计算属性：根据选中项目获取考生列表
const filteredCandidates = computed(() => {
  const selectedProject = projectStore.projects.find(p => p.id === selectedProjectId.value)
  if (!selectedProject) return []
  return candidateStore.getCandidatesByProject(selectedProject.name)
})

// 生命周期钩子
onMounted(async () => {
  loading.value = true
  
  try {
    // 加载项目和考生数据
    await Promise.all([
      projectStore.fetchProjects(),
      candidateStore.fetchCandidates()
    ])
    
    // 如果有活跃项目，默认选中第一个
    if (projectStore.activeProjects.length > 0) {
      selectedProjectId.value = projectStore.activeProjects[0].id
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    showMessage('加载数据失败，请稍后重试', 'error')
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

// 手动添加考生
async function addCandidate() {
  // 表单验证
  if (!candidateForm.value.name || !candidateForm.value.idCard || !candidateForm.value.projectName) {
    showMessage('请填写完整的考生信息', 'error')
    return
  }
  
  // 身份证号格式验证（简单验证）
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardRegex.test(candidateForm.value.idCard)) {
    showMessage('请输入有效的身份证号', 'error')
    return
  }
  
  loading.value = true
  
  try {
    // 调用添加考生API
    const success = await candidateStore.addCandidate(candidateForm.value)
    
    if (success) {
      showMessage('考生添加成功')
      // 重置表单
      candidateForm.value = {
        name: '',
        idCard: '',
        projectName: candidateForm.value.projectName // 保留项目名称
      }
    } else {
      showMessage('考生添加失败', 'error')
    }
  } catch (error) {
    console.error('添加考生失败:', error)
    showMessage('添加考生失败', 'error')
  } finally {
    loading.value = false
  }
}

// 导入考生数据
async function importCandidates() {
  loading.value = true
  
  try {
    const result = await candidateStore.importCandidates()
    
    if (result.success) {
      showMessage(`成功导入${result.data?.length || 0}名考生`)
    } else {
      showMessage(result.message || '导入考生失败', 'error')
    }
  } catch (error) {
    console.error('导入考生失败:', error)
    showMessage('导入考生失败', 'error')
  } finally {
    loading.value = false
  }
}

// 删除考生
async function deleteCandidate(idCard) {
  if (!confirm('确定要删除此考生吗？')) return
  
  loading.value = true
  
  try {
    const success = await candidateStore.deleteCandidate(idCard)
    
    if (success) {
      showMessage('考生删除成功')
    } else {
      showMessage('考生删除失败', 'error')
    }
  } catch (error) {
    console.error('删除考生失败:', error)
    showMessage('删除考生失败', 'error')
  } finally {
    loading.value = false
  }
}

// 清空考生列表
async function clearCandidates() {
  if (!confirm('确定要清空所有考生吗？此操作不可恢复！')) return
  
  loading.value = true
  
  try {
    const success = await candidateStore.clearCandidates()
    
    if (success) {
      showMessage('考生列表已清空')
    } else {
      showMessage('清空考生列表失败', 'error')
    }
  } catch (error) {
    console.error('清空考生列表失败:', error)
    showMessage('清空考生列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 开始考试
async function startExam(candidate) {
  // 检查是否有选中的项目
  if (!selectedProjectId.value) {
    showMessage('请先选择一个项目', 'error')
    return
  }
  
  // 获取选中的项目
  const selectedProject = projectStore.projects.find(p => p.id === selectedProjectId.value)
  if (!selectedProject) {
    showMessage('所选项目不存在', 'error')
    return
  }
  
  loading.value = true
  
  try {
    // 获取项目下的题目
    await questionStore.fetchQuestionsByProjectId(selectedProjectId.value)
    
    // 检查题目数量
    if (questionStore.questionCount === 0) {
      showMessage(`项目"${selectedProject.name}"没有题目，请先添加题目`, 'error')
      loading.value = false
      return
    }
    
    // 检查是否有足够的必选题和可选题
    const mandatoryCount = questionStore.mandatoryCount
    const optionalCount = questionStore.optionalCount
    const settings = userStore.userSettings || { defaultQuestionCount: 10 }
    
    if (mandatoryCount < settings.defaultQuestionCount) {
      showMessage(`必选题数量不足，当前只有${mandatoryCount}道题，需要至少${settings.defaultQuestionCount}道`, 'error')
      loading.value = false
      return
    }
    
    // 抽取题目
    const result = await questionStore.drawQuestions({
      projectId: selectedProjectId.value,
      candidateId: candidate.id,
      candidateName: candidate.name,
      count: settings.defaultQuestionCount
    })
    
    if (result.success) {
      // 设置当前考生
      candidateStore.setCurrentCandidate(candidate)
      
      // 跳转到考试页面
      router.push(`/candidate/exam?examId=${result.data.examId}`)
    } else {
      showMessage(result.message || '抽题失败', 'error')
    }
  } catch (error) {
    console.error('开始考试失败:', error)
    showMessage('开始考试失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dashboard-container">
    <h1 class="page-title">考试抽题</h1>
    
    <!-- 加载状态 -->
    <loading-spinner v-if="loading" overlay />
    
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <div class="dashboard-content">
      <!-- 项目选择 -->
      <div class="section">
        <h2 class="section-title">选择项目</h2>
        
        <div class="project-selector">
          <select v-model="selectedProjectId" class="form-control">
            <option value="" disabled>请选择项目</option>
            <option v-for="project in activeProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- 考生管理 -->
      <div class="section">
        <h2 class="section-title">考生管理</h2>
        
        <!-- 手动添加考生 -->
        <div class="add-candidate-form">
          <h3>添加考生</h3>
          
          <div class="form-group">
            <label for="candidateName">姓名</label>
            <input 
              id="candidateName" 
              v-model="candidateForm.name" 
              type="text" 
              placeholder="请输入考生姓名"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label for="candidateIdCard">身份证号</label>
            <input 
              id="candidateIdCard" 
              v-model="candidateForm.idCard" 
              type="text" 
              placeholder="请输入身份证号"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label for="candidateProject">项目名称</label>
            <input 
              id="candidateProject" 
              v-model="candidateForm.projectName" 
              type="text" 
              placeholder="请输入项目名称"
              class="form-control"
            >
          </div>
          
          <div class="form-actions">
            <button @click="addCandidate" class="btn-primary">添加考生</button>
            <button @click="importCandidates" class="btn-secondary">批量导入</button>
            <button @click="clearCandidates" class="btn-danger">清空考生</button>
          </div>
        </div>
        
        <!-- 考生列表 -->
        <div class="candidate-list">
          <h3>考生列表 <span class="count">({{ filteredCandidates.length }})</span></h3>
          
          <div v-if="filteredCandidates.length === 0" class="empty-list">
            暂无考生，请添加考生或选择其他项目
          </div>
          
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>身份证号</th>
                <th>项目</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="candidate in filteredCandidates" :key="candidate.id">
                <td>{{ candidate.name }}</td>
                <td>{{ candidate.idCard }}</td>
                <td>{{ candidate.projectName }}</td>
                <td>
                  <button @click="startExam(candidate)" class="btn-sm btn-primary">开始考试</button>
                  <button @click="deleteCandidate(candidate.idCard)" class="btn-sm btn-danger">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
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
  margin-bottom: 20px;
  font-size: 14px;
}

.message.success {
  background-color: var(--success-bg-color);
  color: var(--success-text-color);
}

.message.error {
  background-color: var(--error-bg-color);
  color: var(--error-text-color);
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 992px) {
  .dashboard-content {
    grid-template-columns: 300px 1fr;
  }
}

.section {
  background-color: var(--bg-color-card);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-dark);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.project-selector {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.add-candidate-form {
  margin-bottom: 24px;
}

.add-candidate-form h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

.candidate-list h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.count {
  font-size: 14px;
  color: var(--text-light);
  margin-left: 8px;
}

.empty-list {
  padding: 16px;
  text-align: center;
  color: var(--text-light);
  background-color: var(--bg-color-light);
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  font-weight: 500;
  background-color: var(--bg-color-light);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  margin-right: 4px;
}

.btn-danger {
  background-color: var(--error-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-danger:hover {
  background-color: var(--error-hover-color);
}

.btn-secondary {
  background-color: var(--secondary-color, #6c757d);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: var(--secondary-hover-color, #5a6268);
}
</style>