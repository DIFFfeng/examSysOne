<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

// 获取路由和用户存储
const router = useRouter()
const userStore = useUserStore()

// 侧边栏状态
const sidebarCollapsed = ref(false)

// 计算属性：获取当前用户名
const username = computed(() => userStore.user?.username || '管理员')

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 登出处理
async function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">智能抽题系统</h1>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <span class="toggle-icon"></span>
        </button>
      </div>
      
      <div class="sidebar-content">
        <div class="user-info">
          <div class="avatar">{{ username.charAt(0) }}</div>
          <div class="user-details">
            <div class="username">{{ username }}</div>
            <div class="role">管理员</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/admin/dashboard" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-text">考试管理</span>
          </router-link>
          
          <router-link to="/admin/projects" class="nav-item">
            <span class="nav-icon">📁</span>
            <span class="nav-text">作业维护</span>
          </router-link>
          
          <router-link to="/admin/questions" class="nav-item">
            <span class="nav-icon">📝</span>
            <span class="nav-text">题库维护</span>
          </router-link>
          
          <router-link to="/admin/settings" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">用户设置</span>
          </router-link>
        </nav>
      </div>
      
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <span class="logout-icon">🚪</span>
          <span class="logout-text">退出登录</span>
        </button>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <header class="main-header">
        <button class="mobile-sidebar-toggle" @click="toggleSidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div class="header-title">
          <slot name="header-title">智能抽题考试系统</slot>
        </div>
      </header>
      
      <div class="content-wrapper">
        <!-- 路由视图 -->
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 260px;
  background-color: var(--bg-color-sidebar);
  color: var(--text-light);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-collapsed .sidebar {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  position: relative;
  width: 18px;
  height: 2px;
  background-color: var(--text-light);
}

.toggle-icon::before,
.toggle-icon::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 2px;
  background-color: var(--text-light);
  transition: transform 0.3s ease;
}

.toggle-icon::before {
  transform: translateY(-6px);
}

.toggle-icon::after {
  transform: translateY(6px);
}

.sidebar-collapsed .toggle-icon {
  background-color: transparent;
}

.sidebar-collapsed .toggle-icon::before {
  transform: rotate(45deg);
}

.sidebar-collapsed .toggle-icon::after {
  transform: rotate(-45deg);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 0 16px 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-details {
  overflow: hidden;
}

.username {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-collapsed .user-details {
  display: none;
}

.sidebar-nav {
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-radius: 4px;
  color: var(--text-light);
  text-decoration: none;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.sidebar-collapsed .nav-text {
  display: none;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.logout-icon {
  margin-right: 8px;
}

.sidebar-collapsed .logout-text {
  display: none;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-color-main);
}

.main-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.mobile-sidebar-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 16px;
}

.mobile-sidebar-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-dark);
  transition: transform 0.3s ease;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-dark);
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .admin-layout.sidebar-collapsed .sidebar {
    transform: translateX(0);
    width: 260px;
  }
  
  .admin-layout.sidebar-collapsed .sidebar-collapsed .user-details,
  .admin-layout.sidebar-collapsed .sidebar-collapsed .nav-text,
  .admin-layout.sidebar-collapsed .sidebar-collapsed .logout-text {
    display: block;
  }
  
  .mobile-sidebar-toggle {
    display: flex;
  }
}
</style>