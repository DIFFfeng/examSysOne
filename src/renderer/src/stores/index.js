import { createPinia } from 'pinia'

// 导入所有存储
import { useUserStore } from './user'
import { useProjectStore } from './project'
import { useQuestionStore } from './question'
import { useCandidateStore } from './candidate'

// 创建Pinia实例
const pinia = createPinia()

export {
  pinia,
  useUserStore,
  useProjectStore,
  useQuestionStore,
  useCandidateStore
}