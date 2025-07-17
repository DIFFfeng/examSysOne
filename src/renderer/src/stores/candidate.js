import { defineStore } from 'pinia'

export const useCandidateStore = defineStore('candidate', {
  state: () => ({
    candidates: [],
    currentCandidate: null,
    loading: false,
    error: null
  }),
  
  actions: {
    /**
     * 获取所有考生
     */
    async fetchCandidates() {
      this.loading = true
      this.error = null
      
      try {
        const candidates = await window.api.candidates.getAll()
        this.candidates = candidates
      } catch (error) {
        console.error('获取考生列表失败:', error)
        this.error = '获取考生列表失败'
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 添加考生
     * @param {Object} candidateData - 考生数据
     */
    async addCandidate(candidateData) {
      this.loading = true
      this.error = null
      
      try {
        const success = await window.api.candidates.add(candidateData)
        
        if (success) {
          // 重新获取考生列表
          await this.fetchCandidates()
        }
        
        return success
      } catch (error) {
        console.error('添加考生失败:', error)
        this.error = '添加考生失败'
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 删除考生
     * @param {string} idCard - 身份证号
     */
    async deleteCandidate(idCard) {
      this.loading = true
      this.error = null
      
      try {
        const success = await window.api.candidates.delete(idCard)
        
        if (success) {
          this.candidates = this.candidates.filter(c => c.idCard !== idCard)
          
          // 如果删除的是当前选中的考生，清空currentCandidate
          if (this.currentCandidate && this.currentCandidate.idCard === idCard) {
            this.currentCandidate = null
          }
        }
        
        return success
      } catch (error) {
        console.error('删除考生失败:', error)
        this.error = '删除考生失败'
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 清空考生列表
     */
    async clearCandidates() {
      this.loading = true
      this.error = null
      
      try {
        const success = await window.api.candidates.clear()
        
        if (success) {
          this.candidates = []
          this.currentCandidate = null
        }
        
        return success
      } catch (error) {
        console.error('清空考生列表失败:', error)
        this.error = '清空考生列表失败'
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 导入考生数据
     */
    async importCandidates() {
      this.loading = true
      this.error = null
      
      try {
        const result = await window.api.utils.importFromExcel()
        
        if (result.success && result.data && result.data.length > 0) {
          // 重新获取考生列表
          await this.fetchCandidates()
        }
        
        return result
      } catch (error) {
        console.error('导入考生数据失败:', error)
        this.error = '导入考生数据失败'
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 设置当前选中的考生
     * @param {Object|null} candidate - 考生对象
     */
    setCurrentCandidate(candidate) {
      this.currentCandidate = candidate
    }
  },
  
  getters: {
    /**
     * 获取考生总数
     * @returns {number} 考生总数
     */
    candidateCount: (state) => state.candidates.length,
    
    /**
     * 根据项目名称获取考生列表
     * @returns {Function} 返回一个函数，接受项目名称参数
     */
    getCandidatesByProject: (state) => (projectName) => {
      if (!projectName) return []
      return state.candidates.filter(c => c.projectName === projectName)
    }
  }
})