// 导入样式
import './assets/global.css'
import './assets/print.css'

// 导入Vue核心
import { createApp } from 'vue'
import App from './App.vue'

// 导入路由
import router from './router'

// 导入Pinia存储
import { pinia } from './stores'

// 导入全局组件
import LoadingSpinner from './components/LoadingSpinner.vue'
import MessageAlert from './components/MessageAlert.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ModalDialog from './components/ModalDialog.vue'

// 创建Vue应用实例
const app = createApp(App)

// 注册全局组件
app.component('LoadingSpinner', LoadingSpinner)
app.component('MessageAlert', MessageAlert)
app.component('ConfirmDialog', ConfirmDialog)
app.component('ModalDialog', ModalDialog)

// 使用插件
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')
