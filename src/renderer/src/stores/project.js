import { defineStore } from 'pinia'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  }),
  
  actions: {
    /**
     * 获取所有项目
     */
    async fetchProjects() {
      this.loading = true
      this.error = null
      
      try {
        const projects = await window.api.projects.getAll()
        this.projects = projects
      } catch (error) {
        console.error('获取项目列表失败:', error)
        this.error = '获取项目列表失败'
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 创建新项目
     * @param {Object} projectData - 项目数据
     */
    async createProject(projectData) {
      this.loading = true
      this.error = null
      
      try {
        const newProject = await window.api.projects.create(projectData)
        this.projects.push(newProject)
        return newProject
      } catch (error) {
        console.error('创建项目失败:', error)
        this.error = '创建项目失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 更新项目
     * @param {string} projectId - 项目ID
     * @param {Object} projectData - 更新的项目数据
     */
    async updateProject(projectId, projectData) {
      this.loading = true
      this.error = null
      
      try {
        const updatedProject = await window.api.projects.update(projectId, projectData)
        
        if (updatedProject) {
          const index = this.projects.findIndex(p => p.id === projectId)
          if (index !== -1) {
            this.projects[index] = updatedProject
          }
          
          // 如果当前选中的项目被更新，也更新currentProject
          if (this.currentProject && this.currentProject.id === projectId) {
            this.currentProject = updatedProject
          }
        }
        
        return updatedProject
      } catch (error) {
        console.error('更新项目失败:', error)
        this.error = '更新项目失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 删除项目
     * @param {string} projectId - 项目ID
     */
    async deleteProject(projectId) {
      this.loading = true
      this.error = null
      
      try {
        const success = await window.api.projects.delete(projectId)
        
        if (success) {
          this.projects = this.projects.filter(p => p.id !== projectId)
          
          // 如果删除的是当前选中的项目，清空currentProject
          if (this.currentProject && this.currentProject.id === projectId) {
            this.currentProject = null
          }
        }
        
        return success
      } catch (error) {
        console.error('删除项目失败:', error)
        this.error = '删除项目失败'
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 设置当前选中的项目
     * @param {Object|string} project - 项目对象或项目ID
     */
    setCurrentProject(project) {
      if (!project) {
        this.currentProject = null
        return
      }
      
      if (typeof project === 'string') {
        // 如果传入的是ID，查找对应的项目对象
        const foundProject = this.projects.find(p => p.id === project)
        this.currentProject = foundProject || null
      } else {
        // 如果传入的是项目对象，直接设置
        this.currentProject = project
      }
    }
  },
  
  getters: {
    /**
     * 获取活跃状态的项目列表
     * @returns {Array} 活跃项目列表
     */
    activeProjects: (state) => state.projects.filter(p => p.status === 'active'),
    
    /**
     * 获取项目总数
     * @returns {number} 项目总数
     */
    projectCount: (state) => state.projects.length,
    
    /**
     * 获取活跃项目总数
     * @returns {number} 活跃项目总数
     */
    activeProjectCount: (state) => state.projects.filter(p => p.status === 'active').length
  }
})