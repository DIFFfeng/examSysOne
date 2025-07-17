<script setup>
// App.vue - 应用程序根组件
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useRouter } from 'vue-router'

// 获取用户存储和路由器
const userStore = useUserStore()
const router = useRouter()

// 在组件挂载时恢复用户会话
onMounted(() => {
  // 尝试从本地存储恢复用户会话
  const user = userStore.restoreUser()
  console.log('App.vue - 恢复用户会话:', user)
  
  // 如果成功恢复用户会话，根据用户角色重定向到对应页面
  if (user && router.currentRoute.value.path === '/login') {
    console.log('App.vue - 用户已登录，重定向到对应页面')
    if (user.role === 'admin') {
      console.log('App.vue - 重定向到管理员页面')
      router.push('/admin/dashboard')
    } else {
      console.log('App.vue - 重定向到考生页面')
      router.push('/candidate/exam')
    }
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* 应用程序根样式 */
.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
