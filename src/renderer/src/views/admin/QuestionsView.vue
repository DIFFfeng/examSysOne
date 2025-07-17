<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectStore } from '../../stores/project'
import { useQuestionStore } from '../../stores/question'

// 获取存储
const projectStore = useProjectStore()
const questionStore = useQuestionStore()

// 页面状态
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// 选中的项目ID
const selectedProjectId = ref('')

// 模态框状态
const showModal = ref(false)
const modalMode = ref('create') // 'create' 或 'edit'
const currentQuestion = ref(null)

// 题目表单
const questionForm = ref({
  projectId: '',
  type: 'text',
  content: '',
  imageUrl: null,
  isMandatory: false
})

// 图片上传相关
const imageFile = ref(null)
const imagePreview = ref('')

// 计算属性：获取活跃项目列表
const activeProjects = computed(() => projectStore.activeProjects)

// 计算属性：获取题目统计信息
const questionCount = computed(() => questionStore.questionCount)
const mandatoryCount = computed(() => questionStore.mandatoryCount)
const optionalCount = computed(() => questionStore.optionalCount)
const imageQuestionCount = computed(() => questionStore.imageQuestionCount)

// 生命周期钩子
onMounted(async () => {
  loading.value = true
  
  try {
    // 加载项目数据
    await projectStore.fetchProjects()
    
    // 如果有活跃项目，默认选中第一个
    if (projectStore.activeProjects.length > 0) {
      selectedProjectId.value = projectStore.activeProjects[0].id
    }
  } catch (error) {
    console.error('加载项目失败:', error)
    showMessage('加载项目失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
})

// 监听选中项目变化，加载对应题目
watch(selectedProjectId, async (newProjectId) => {
  if (newProjectId) {
    loading.value = true
    
    try {
      await questionStore.fetchQuestionsByProjectId(newProjectId)
    } catch (error) {
      console.error('加载题目失败:', error)
      showMessage('加载题目失败，请稍后重试', 'error')
    } finally {
      loading.value = false
    }
  } else {
    // 清空题目列表
    questionStore.$reset()
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

// 打开创建题目模态框
function openCreateModal() {
  if (!selectedProjectId.value) {
    showMessage('请先选择一个项目', 'error')
    return
  }
  
  modalMode.value = 'create'
  questionForm.value = {
    projectId: selectedProjectId.value,
    type: 'text',
    content: '',
    imageUrl: null,
    isMandatory: false
  }
  imageFile.value = null
  imagePreview.value = ''
  showModal.value = true
}

// 打开编辑题目模态框
function openEditModal(question) {
  modalMode.value = 'edit'
  currentQuestion.value = question
  questionForm.value = {
    projectId: question.projectId,
    type: question.type,
    content: question.content,
    imageUrl: question.imageUrl,
    isMandatory: question.isMandatory
  }
  
  // 如果有图片，设置预览
  imageFile.value = null
  imagePreview.value = question.imageUrl ? `data/images/${question.imageUrl}` : ''
  
  showModal.value = true
}

// 关闭模态框
function closeModal() {
  showModal.value = false
  currentQuestion.value = null
  imageFile.value = null
  imagePreview.value = ''
}

// 处理图片选择
function handleImageSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    showMessage('请选择有效的图片文件（JPEG、PNG、GIF）', 'error')
    return
  }
  
  // 验证文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    showMessage('图片大小不能超过5MB', 'error')
    return
  }
  
  // 保存文件引用并创建预览
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  
  // 设置题目类型为图片
  questionForm.value.type = 'image'
}

// 移除图片
function removeImage() {
  imageFile.value = null
  imagePreview.value = ''
  questionForm.value.imageUrl = null
  
  // 如果是编辑模式且原题目有图片，则需要在保存时删除原图片
  if (modalMode.value === 'edit' && currentQuestion.value && currentQuestion.value.imageUrl) {
    questionForm.value.type = 'text'
  }
}

// 保存题目
async function saveQuestion() {
  // 表单验证
  if (!questionForm.value.content) {
    showMessage('题目内容不能为空', 'error')
    return
  }
  
  loading.value = true
  
  try {
    // 处理图片上传
    if (imageFile.value) {
      const result = await questionStore.saveImage(imageFile.value)
      if (result.success) {
        questionForm.value.imageUrl = result.imageUrl
        questionForm.value.type = 'image'
      } else {
        showMessage('图片上传失败', 'error')
        loading.value = false
        return
      }
    }
    
    if (modalMode.value === 'create') {
      // 创建新题目
      await questionStore.createQuestion(questionForm.value)
      showMessage('题目创建成功')
    } else {
      // 更新现有题目
      // 如果从图片题改为文本题，需要删除原图片
      if (currentQuestion.value.type === 'image' && questionForm.value.type === 'text') {
        await questionStore.deleteImage(currentQuestion.value.imageUrl)
      }
      
      await questionStore.updateQuestion(currentQuestion.value.id, questionForm.value)
      showMessage('题目更新成功')
    }
    
    // 关闭模态框
    closeModal()
  } catch (error) {
    console.error('保存题目失败:', error)
    showMessage('保存题目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 删除题目
async function deleteQuestion(questionId, imageUrl) {
  if (!confirm('确定要删除此题目吗？此操作不可恢复！')) return
  
  loading.value = true
  
  try {
    // 如果是图片题，先删除图片
    if (imageUrl) {
      await questionStore.deleteImage(imageUrl)
    }
    
    // 删除题目
    await questionStore.deleteQuestion(questionId)
    showMessage('题目删除成功')
  } catch (error) {
    console.error('删除题目失败:', error)
    showMessage('删除题目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 批量删除选中项目下的所有题目
async function deleteAllQuestions() {
  if (!selectedProjectId.value) {
    showMessage('请先选择一个项目', 'error')
    return
  }
  
  if (!confirm(`确定要删除项目下的所有${questionCount.value}个题目吗？此操作不可恢复！`)) return
  
  loading.value = true
  
  try {
    await questionStore.deleteQuestionsByProjectId(selectedProjectId.value)
    showMessage('题目批量删除成功')
  } catch (error) {
    console.error('批量删除题目失败:', error)
    showMessage('批量删除题目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 切换题目必考状态
async function toggleMandatory(question) {
  loading.value = true
  
  try {
    const updatedData = {
      ...question,
      isMandatory: !question.isMandatory
    }
    
    await questionStore.updateQuestion(question.id, updatedData)
    showMessage(`题目已设为${updatedData.isMandatory ? '必考题' : '选考题'}`)
  } catch (error) {
    console.error('更新题目状态失败:', error)
    showMessage('更新题目状态失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="questions-container">
    <h1 class="page-title">题库维护</h1>
    
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 项目选择 -->
    <div class="card mb-4">
      <div class="card-header">
        <h2>选择项目</h2>
      </div>
      <div class="card-body">
        <div v-if="activeProjects.length === 0" class="empty-state">
          <p>暂无活跃项目，请先在作业维护中创建项目</p>
        </div>
        <div v-else class="form-group">
          <label for="project-select">项目</label>
          <select 
            id="project-select" 
            v-model="selectedProjectId"
            class="form-control"
          >
            <option value="" disabled>请选择项目</option>
            <option 
              v-for="project in activeProjects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 题目统计卡片 -->
    <div v-if="selectedProjectId" class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ questionCount }}</div>
        <div class="stat-label">总题目数</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ mandatoryCount }}</div>
        <div class="stat-label">必考题</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ optionalCount }}</div>
        <div class="stat-label">选考题</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ imageQuestionCount }}</div>
        <div class="stat-label">图片题</div>
      </div>
    </div>
    
    <!-- 题目列表卡片 -->
    <div v-if="selectedProjectId" class="card">
      <div class="card-header">
        <h2>题目列表</h2>
        <div class="card-header-actions">
          <button 
            class="btn-danger btn-sm" 
            @click="deleteAllQuestions" 
            :disabled="loading || questionCount === 0"
          >
            清空题库
          </button>
          <button class="btn-primary" @click="openCreateModal">
            新增题目
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="questionCount === 0" class="empty-state">
          <p>当前项目暂无题目</p>
          <button class="btn-primary" @click="openCreateModal">
            添加第一个题目
          </button>
        </div>
        
        <div v-else class="question-list">
          <div 
            v-for="question in questionStore.questions" 
            :key="question.id"
            class="question-item"
          >
            <div class="question-header">
              <div class="question-badges">
                <span 
                  :class="['badge', question.isMandatory ? 'badge-primary' : 'badge-secondary']"
                >
                  {{ question.isMandatory ? '必考题' : '选考题' }}
                </span>
                <span 
                  :class="['badge', question.type === 'image' ? 'badge-info' : 'badge-default']"
                >
                  {{ question.type === 'image' ? '图片题' : '文本题' }}
                </span>
              </div>
              <div class="question-actions">
                <button 
                  class="btn-icon" 
                  :title="question.isMandatory ? '设为选考题' : '设为必考题'"
                  @click="toggleMandatory(question)"
                >
                  {{ question.isMandatory ? '⭐' : '☆' }}
                </button>
                
                <button 
                  class="btn-icon" 
                  title="编辑"
                  @click="openEditModal(question)"
                >
                  ✏️
                </button>
                
                <button 
                  class="btn-icon" 
                  title="删除"
                  @click="deleteQuestion(question.id, question.imageUrl)"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="question-content">
              <p>{{ question.content }}</p>
              
              <div v-if="question.type === 'image' && question.imageUrl" class="question-image">
                <img :src="`data/images/${question.imageUrl}`" alt="题目图片">
              </div>
            </div>
            
            <div class="question-footer">
              <span class="question-id">ID: {{ question.id }}</span>
              <span class="question-date">创建时间: {{ question.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 题目模态框 -->
    <div v-if="showModal" class="modal-backdrop" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalMode === 'create' ? '新增题目' : '编辑题目' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveQuestion">
            <div class="form-group">
              <label for="question-content">题目内容</label>
              <textarea 
                id="question-content" 
                v-model="questionForm.content" 
                class="form-control" 
                placeholder="请输入题目内容"
                rows="4"
                required
              ></textarea>
            </div>
            
            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="questionForm.isMandatory"
                  >
                  设为必考题
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>题目图片</label>
              
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="题目图片预览">
                <button type="button" class="btn-danger btn-sm" @click="removeImage">
                  移除图片
                </button>
              </div>
              
              <div v-else class="image-upload">
                <label for="question-image" class="upload-label">
                  <span class="upload-icon">📷</span>
                  <span class="upload-text">点击上传图片</span>
                </label>
                <input 
                  id="question-image" 
                  type="file" 
                  accept="image/*" 
                  class="upload-input" 
                  @change="handleImageSelect"
                >
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="saveQuestion">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.questions-container {
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

.mb-4 {
  margin-bottom: 24px;
}

.stats-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
  min-width: 120px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.stat-label {
  color: var(--text-muted);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.card-header-actions {
  display: flex;
  gap: 12px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-color-light);
  border-bottom: 1px solid var(--border-color);
}

.question-badges {
  display: flex;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-primary {
  background-color: var(--primary-color);
  color: var(--text-light);
}

.badge-secondary {
  background-color: var(--secondary-color);
  color: var(--text-light);
}

.badge-info {
  background-color: var(--info-color);
  color: var(--text-light);
}

.badge-default {
  background-color: var(--bg-color-dark);
  color: var(--text-light);
}

.question-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.question-content {
  padding: 16px;
}

.question-content p {
  margin: 0 0 16px;
  white-space: pre-wrap;
}

.question-image {
  margin-top: 12px;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.question-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--text-dark);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 8px;
}

.image-preview {
  margin-top: 12px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
}

.image-upload {
  margin-top: 12px;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-label:hover {
  border-color: var(--primary-color);
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text {
  color: var(--text-muted);
}

.upload-input {
  display: none;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-card {
    min-width: auto;
  }
}
</style>