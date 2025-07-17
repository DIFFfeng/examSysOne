import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义API，暴露给渲染进程
const api = {
  // 认证相关
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    updatePassword: (userId, newPassword) => ipcRenderer.invoke('auth:updatePassword', userId, newPassword)
  },
  
  // 项目管理
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    create: (projectData) => ipcRenderer.invoke('projects:create', projectData),
    update: (projectId, projectData) => ipcRenderer.invoke('projects:update', projectId, projectData),
    delete: (projectId) => ipcRenderer.invoke('projects:delete', projectId)
  },
  
  // 题库管理
  questions: {
    getByProjectId: (projectId) => ipcRenderer.invoke('questions:getByProjectId', projectId),
    create: (questionData) => ipcRenderer.invoke('questions:create', questionData),
    update: (questionId, questionData) => ipcRenderer.invoke('questions:update', questionId, questionData),
    delete: (questionId) => ipcRenderer.invoke('questions:delete', questionId)
  },
  
  // 图片管理
  images: {
    // 注意：这里需要在渲染进程中将图片转为Buffer
    save: (imageBuffer, originalName) => ipcRenderer.invoke('images:save', imageBuffer, originalName),
    delete: (relativePath) => ipcRenderer.invoke('images:delete', relativePath)
  },
  
  // 设置管理
  settings: {
    get: (userId) => ipcRenderer.invoke('settings:get', userId),
    update: (userId, settings) => ipcRenderer.invoke('settings:update', userId, settings)
  },
  
  // 考生管理
  candidates: {
    getAll: () => ipcRenderer.invoke('candidates:getAll'),
    add: (candidateData) => ipcRenderer.invoke('candidates:add', candidateData),
    delete: (idCard) => ipcRenderer.invoke('candidates:delete', idCard),
    clear: () => ipcRenderer.invoke('candidates:clear')
  },
  
  // 抽题功能
  exam: {
    drawQuestions: (projectId, count) => ipcRenderer.invoke('exam:drawQuestions', projectId, count)
  },
  
  // 工具类
  utils: {
    importFromExcel: () => ipcRenderer.invoke('utils:importFromExcel'),
    printWindow: () => ipcRenderer.send('utils:printWindow')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
