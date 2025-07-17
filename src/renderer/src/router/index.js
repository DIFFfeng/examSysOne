import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    // 管理员路由
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/DashboardView.vue'),
        meta: { title: '考试抽题' }
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: () => import('../views/admin/ProjectsView.vue'),
        meta: { title: '作业维护' }
      },
      {
        path: 'questions',
        name: 'admin-questions',
        component: () => import('../views/admin/QuestionsView.vue'),
        meta: { title: '题库维护' }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/admin/SettingsView.vue'),
        meta: { title: '用户设置' }
      }
    ]
  },
  {
    // 考生路由
    path: '/candidate',
    component: () => import('../layouts/CandidateLayout.vue'),
    meta: { requiresAuth: true, role: 'candidate' },
    children: [
      {
        path: '',
        redirect: '/candidate/welcome'
      },
      {
        path: 'welcome',
        name: 'candidate-welcome',
        component: () => import('../views/candidate/WelcomeView.vue'),
        meta: { title: '考试欢迎' }
      },
      {
        path: 'exam',
        name: 'exam-paper',
        component: () => import('../views/candidate/ExamPaperView.vue'),
        meta: { title: '考试试卷' }
      }
    ]
  },
  {
    // 404页面
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 如果未登录，尝试恢复用户会话
  if (!userStore.isAuthenticated) {
    console.log('路由守卫: 尝试恢复用户会话')
    userStore.restoreUser()
  }
  
  const isAuthenticated = userStore.isAuthenticated
  const userRole = userStore.user?.role
  
  // 添加详细调试日志
  console.log('路由守卫:', { 
    to: to.path, 
    from: from.path,
    requiresAuth: to.meta.requiresAuth, 
    role: to.meta.role,
    isAuthenticated,
    userRole
  })
  
  // 需要认证的路由
  if (to.meta.requiresAuth) {
    // 未认证，重定向到登录页
    if (!isAuthenticated) {
      console.log('路由守卫: 未认证，重定向到登录页')
      return next({ path: '/login' })
    }
    
    // 需要特定角色
    if (to.meta.role && to.meta.role !== userRole) {
      console.log('路由守卫: 角色不匹配，重定向到对应首页')
      // 根据当前角色重定向到对应首页
      if (userRole === 'admin') {
        console.log('路由守卫: 重定向到管理员首页')
        return next({ path: '/admin/dashboard' })
      } else if (userRole === 'candidate') {
        console.log('路由守卫: 重定向到考生首页')
        return next({ path: '/candidate/exam' })
      } else {
        return next({ path: '/login' })
      }
    }
  }
  
  // 已登录用户访问登录页，重定向到对应首页
  if (to.path === '/login' && isAuthenticated) {
    console.log('路由守卫: 已登录用户访问登录页，重定向到对应首页')
    if (userRole === 'admin') {
      console.log('路由守卫: 管理员重定向到管理员首页')
      return next({ path: '/admin/dashboard' })
    } else {
      console.log('路由守卫: 考生重定向到考生首页')
      return next({ path: '/candidate/exam' })
    }
  }
  
  // 正常导航
  console.log('路由守卫: 正常导航到', to.path)
  next()
})

export default router