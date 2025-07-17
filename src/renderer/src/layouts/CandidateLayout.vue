<script setup>
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

// 获取用户存储和路由器
const userStore = useUserStore()
const router = useRouter()

// 退出登录
async function logout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="candidate-layout">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>智能抽题考试系统</h1>
        </div>
        
        <div class="user-actions">
          <span class="username" v-if="userStore.user">
            {{ userStore.user.username }}
          </span>
          <button class="btn-text" @click="logout">退出登录</button>
        </div>
      </div>
    </header>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view></router-view>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>© {{ new Date().getFullYear() }} 智能抽题考试系统 - 版权所有</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.candidate-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: var(--bg-color-sidebar);
  color: var(--text-light);
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.logo h1 {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-weight: 500;
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-text:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background-color: var(--bg-color-sidebar);
  color: var(--text-light);
  padding: 16px 20px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 10px;
  }
  
  .logo h1 {
    font-size: 18px;
  }
  
  .main-content {
    padding: 15px;
  }
}
</style>