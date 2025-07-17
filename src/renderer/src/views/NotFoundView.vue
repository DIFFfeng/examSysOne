<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      <div class="action-buttons">
        <button class="btn-primary" @click="goBack">返回上一页</button>
        <button class="btn-secondary" @click="goHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 返回上一页
function goBack() {
  router.back()
}

// 返回首页（根据用户角色）
function goHome() {
  const userRole = userStore.user?.role
  
  if (userRole === 'admin') {
    router.push('/admin')
  } else if (userRole === 'candidate') {
    router.push('/candidate')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 500px;
  width: 100%;
}

h1 {
  font-size: 72px;
  margin: 0;
  color: var(--primary-color);
  line-height: 1;
}

h2 {
  font-size: 24px;
  margin: 10px 0 20px;
  color: var(--text-dark);
}

p {
  color: var(--text-muted);
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-secondary:hover {
  background-color: var(--primary-light);
}
</style>