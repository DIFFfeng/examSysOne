import { defineStore } from 'pinia'

export const useQuestionStore = defineStore('question', {
  state: () => ({
    questions: [],
    currentQuestion: null,
    loading: false,
    error: null
  }),
  
  actions: {
    /**
     * 根据项目ID获取题目
     * @param {string} projectId - 项目ID
     */
    async fetchQuestionsByProjectId(projectId) {
      if (!projectId) {
        this.questions = []
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const questions = await window.api.questions.getByProjectId(projectId)
        this.questions = questions
      } catch (error) {
        console.error('获取题目列表失败:', error)
        this.error = '获取题目列表失败'
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 创建新题目
     * @param {Object} questionData - 题目数据
     */
    async createQuestion(questionData) {
      this.loading = true
      this.error = null
      
      try {
        const newQuestion = await window.api.questions.create(questionData)
        this.questions.push(newQuestion)
        return newQuestion
      } catch (error) {
        console.error('创建题目失败:', error)
        this.error = '创建题目失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 更新题目
     * @param {string} questionId - 题目ID
     * @param {Object} questionData - 更新的题目数据
     */
    async updateQuestion(questionId, questionData) {
      this.loading = true
      this.error = null
      
      try {
        const updatedQuestion = await window.api.questions.update(questionId, questionData)
        
        if (updatedQuestion) {
          const index = this.questions.findIndex(q => q.id === questionId)
          if (index !== -1) {
            this.questions[index] = updatedQuestion
          }
          
          // 如果当前选中的题目被更新，也更新currentQuestion
          if (this.currentQuestion && this.currentQuestion.id === questionId) {
            this.currentQuestion = updatedQuestion
          }
        }
        
        return updatedQuestion
      } catch (error) {
        console.error('更新题目失败:', error)
        this.error = '更新题目失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 删除题目
     * @param {string} questionId - 题目ID
     */
    async deleteQuestion(questionId) {
      this.loading = true
      this.error = null
      
      try {
        const success = await window.api.questions.delete(questionId)
        
        if (success) {
          this.questions = this.questions.filter(q => q.id !== questionId)
          
          // 如果删除的是当前选中的题目，清空currentQuestion
          if (this.currentQuestion && this.currentQuestion.id === questionId) {
            this.currentQuestion = null
          }
        }
        
        return success
      } catch (error) {
        console.error('删除题目失败:', error)
        this.error = '删除题目失败'
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 设置当前选中的题目
     * @param {Object|string|null} question - 题目对象或题目ID
     */
    setCurrentQuestion(question) {
      if (!question) {
        this.currentQuestion = null
        return
      }
      
      if (typeof question === 'string') {
        // 如果传入的是ID，查找对应的题目对象
        const foundQuestion = this.questions.find(q => q.id === question)
        this.currentQuestion = foundQuestion || null
      } else {
        // 如果传入的是题目对象，直接设置
        this.currentQuestion = question
      }
    },
    
    /**
     * 保存题目图片
     * @param {ArrayBuffer} imageBuffer - 图片数据
     * @param {string} originalName - 原始文件名
     * @returns {Promise<string|null>} 保存后的图片相对路径
     */
    async saveImage(imageBuffer, originalName) {
      try {
        return await window.api.images.save(imageBuffer, originalName)
      } catch (error) {
        console.error('保存图片失败:', error)
        this.error = '保存图片失败'
        return null
      }
    },
    
    /**
     * 删除题目图片
     * @param {string} relativePath - 图片相对路径
     * @returns {Promise<boolean>} 是否成功删除
     */
    async deleteImage(relativePath) {
      try {
        return await window.api.images.delete(relativePath)
      } catch (error) {
        console.error('删除图片失败:', error)
        this.error = '删除图片失败'
        return false
      }
    },
    
    /**
     * 抽取题目
     * @param {string} projectId - 项目ID
     * @param {number} count - 抽题数量
     * @returns {Promise<Array>} 抽取的题目列表
     */
    async drawQuestions(projectId, count) {
      this.loading = true
      this.error = null
      
      try {
        return await window.api.exam.drawQuestions(projectId, count)
      } catch (error) {
        console.error('抽题失败:', error)
        this.error = '抽题失败'
        return []
      } finally {
        this.loading = false
      }
    }
  },
  
  getters: {
    /**
     * 获取必考题列表
     * @returns {Array} 必考题列表
     */
    mandatoryQuestions: (state) => state.questions.filter(q => q.isMandatory),
    
    /**
     * 获取选考题列表
     * @returns {Array} 选考题列表
     */
    optionalQuestions: (state) => state.questions.filter(q => !q.isMandatory),
    
    /**
     * 获取题目总数
     * @returns {number} 题目总数
     */
    questionCount: (state) => state.questions.length,
    
    /**
     * 获取必考题数量
     * @returns {number} 必考题数量
     */
    mandatoryCount: (state) => state.questions.filter(q => q.isMandatory).length,
    
    /**
     * 获取选考题数量
     * @returns {number} 选考题数量
     */
    optionalCount: (state) => state.questions.filter(q => !q.isMandatory).length,
    
    /**
     * 获取图片题数量
     * @returns {number} 图片题数量
     */
    imageQuestionCount: (state) => state.questions.filter(q => q.type === 'image').length
  }
})