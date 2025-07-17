import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    isAuthenticated: false
  }),
  
  actions: {
    /**
     * 设置当前用户
     * @param {Object} user - 用户对象
     */
    setUser(user) {
      console.log('设置当前用户:', user)
      this.currentUser = user
      this.isAuthenticated = !!user
      
      // 保存到本地存储
      if (user) {
        try {
          const userJson = JSON.stringify(user)
          console.log('保存到本地存储的用户数据:', userJson)
          localStorage.setItem('currentUser', userJson)
          console.log('用户数据已保存到本地存储')
        } catch (error) {
          console.error('保存用户数据到本地存储失败:', error)
        }
      } else {
        console.log('清除本地存储中的用户数据')
        localStorage.removeItem('currentUser')
      }
    },
    
    /**
     * 从本地存储恢复用户会话
     */
    restoreUser() {
      console.log('尝试从本地存储恢复用户会话')
      const savedUser = localStorage.getItem('currentUser')
      console.log('本地存储中的用户数据:', savedUser)
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          console.log('解析后的用户数据:', user)
          this.setUser(user)
          return user
        } catch (error) {
          console.error('恢复用户会话失败:', error)
          this.logout()
        }
      } else {
        console.log('本地存储中没有用户数据')
      }
      return null
    },
    
    /**
     * 登出
     */
    logout() {
      this.currentUser = null
      this.isAuthenticated = false
      localStorage.removeItem('currentUser')
    },
    
    /**
     * 更新用户设置
     * @param {Object} settings - 设置对象
     */
    updateSettings(settings) {
      if (this.currentUser && this.currentUser.settings) {
        this.currentUser.settings = { ...this.currentUser.settings, ...settings }
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      }
    }
  },
  
  getters: {
    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户对象
     */
    user: (state) => state.currentUser,
    
    /**
     * 获取用户角色
     * @returns {string|null} 用户角色
     */
    userRole: (state) => state.currentUser?.role || null,
    
    /**
     * 判断是否为管理员
     * @returns {boolean} 是否为管理员
     */
    isAdmin: (state) => state.currentUser?.role === 'admin',
    
    /**
     * 判断是否为考生
     * @returns {boolean} 是否为考生
     */
    isCandidate: (state) => state.currentUser?.role === 'candidate',
    
    /**
     * 获取用户设置
     * @returns {Object|null} 用户设置
     */
    userSettings: (state) => state.currentUser?.settings || null
  }
})