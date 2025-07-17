<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '../../stores/project'

// 获取项目存储
const projectStore = useProjectStore()

// 页面状态
const loading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// 模态框状态
const showModal = ref(false)
const modalMode = ref('create') // 'create' 或 'edit'
const currentProject = ref(null)

// 项目表单
const projectForm = ref({
  name: '',
  description: '',
  status: 'active'
})

// 计算属性：获取项目总数
const projectCount = computed(() => projectStore.projectCount)

// 计算属性：获取活跃项目数
const activeProjectCount = computed(() => projectStore.activeProjectCount)

// 生命周期钩子
onMounted(async () => {
  loading.value = true
  
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('加载项目失败:', error)
    showMessage('加载项目失败，请稍后重试', 'error')
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

// 打开创建项目模态框
function openCreateModal() {
  modalMode.value = 'create'
  projectForm.value = {
    name: '',
    description: '',
    status: 'active'
  }
  showModal.value = true
}

// 打开编辑项目模态框
function openEditModal(project) {
  modalMode.value = 'edit'
  currentProject.value = project
  projectForm.value = {
    name: project.name,
    description: project.description,
    status: project.status
  }
  showModal.value = true
}

// 关闭模态框
function closeModal() {
  showModal.value = false
  currentProject.value = null
}

// 保存项目
async function saveProject() {
  // 表单验证
  if (!projectForm.value.name) {
    showMessage('项目名称不能为空', 'error')
    return
  }
  
  loading.value = true
  
  try {
    if (modalMode.value === 'create') {
      // 创建新项目
      await projectStore.createProject(projectForm.value)
      showMessage('项目创建成功')
    } else {
      // 更新现有项目
      await projectStore.updateProject(currentProject.value.id, projectForm.value)
      showMessage('项目更新成功')
    }
    
    // 关闭模态框
    closeModal()
  } catch (error) {
    console.error('保存项目失败:', error)
    showMessage('保存项目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 删除项目
async function deleteProject(projectId) {
  if (!confirm('确定要删除此项目吗？此操作将同时删除该项目下的所有题目，且不可恢复！')) return
  
  loading.value = true
  
  try {
    await projectStore.deleteProject(projectId)
    showMessage('项目删除成功')
  } catch (error) {
    console.error('删除项目失败:', error)
    showMessage('删除项目失败', 'error')
  } finally {
    loading.value = false
  }
}

// 切换项目状态
async function toggleProjectStatus(project) {
  loading.value = true
  
  try {
    const updatedData = {
      ...project,
      status: project.status === 'active' ? 'inactive' : 'active'
    }
    
    await projectStore.updateProject(project.id, updatedData)
    showMessage(`项目已${updatedData.status === 'active' ? '激活' : '禁用'}`)
  } catch (error) {
    console.error('更新项目状态失败:', error)
    showMessage('更新项目状态失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="projects-container">
    <h1 class="page-title">作业维护</h1>
    
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 项目统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ projectCount }}</div>
        <div class="stat-label">总项目数</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ activeProjectCount }}</div>
        <div class="stat-label">活跃项目</div>
      </div>
    </div>
    
    <!-- 项目列表卡片 -->
    <div class="card">
      <div class="card-header">
        <h2>项目列表</h2>
        <button class="btn-primary" @click="openCreateModal">
          新增项目
        </button>
      </div>
      
      <div class="card-body">
        <div v-if="projectStore.projects.length === 0" class="empty-state">
          <p>暂无项目数据</p>
          <button class="btn-primary" @click="openCreateModal">
            创建第一个项目
          </button>
        </div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th>项目名称</th>
              <th>描述</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projectStore.projects" :key="project.id">
              <td>{{ project.name }}</td>
              <td>{{ project.description }}</td>
              <td>
                <span 
                  :class="['status-badge', project.status === 'active' ? 'active' : 'inactive']"
                >
                  {{ project.status === 'active' ? '活跃' : '禁用' }}
                </span>
              </td>
              <td>{{ project.createdAt }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn-icon" 
                    :title="project.status === 'active' ? '禁用' : '激活'"
                    @click="toggleProjectStatus(project)"
                  >
                    {{ project.status === 'active' ? '🔴' : '🟢' }}
                  </button>
                  
                  <button 
                    class="btn-icon" 
                    title="编辑"
                    @click="openEditModal(project)"
                  >
                    ✏️
                  </button>
                  
                  <button 
                    class="btn-icon" 
                    title="删除"
                    @click="deleteProject(project.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 项目模态框 -->
    <div v-if="showModal" class="modal-backdrop" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalMode === 'create' ? '新增项目' : '编辑项目' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveProject">
            <div class="form-group">
              <label for="project-name">项目名称</label>
              <input 
                id="project-name" 
                v-model="projectForm.name" 
                type="text" 
                class="form-control" 
                placeholder="请输入项目名称"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="project-description">项目描述</label>
              <textarea 
                id="project-description" 
                v-model="projectForm.description" 
                class="form-control" 
                placeholder="请输入项目描述"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>项目状态</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    v-model="projectForm.status" 
                    value="active"
                  >
                  活跃
                </label>
                
                <label class="radio-label">
                  <input 
                    type="radio" 
                    v-model="projectForm.status" 
                    value="inactive"
                  >
                  禁用
                </label>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="saveProject">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-container {
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

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
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

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: var(--success-bg-color);
  color: var(--success-text-color);
}

.status-badge.inactive {
  background-color: var(--warning-bg-color);
  color: var(--warning-text-color);
}

.action-buttons {
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
  max-width: 500px;
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

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 8px;
}
</style>