import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path' // 确保导入了 dirname
import { fileURLToPath } from 'url' // 导入 url 模块
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

// ESM 方式导入数据管理器
import * as dataManager from './dataManager.js'

// ESM 中获取 __dirname 的标准方法
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // 现在 __dirname 变量是有效的
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册所有IPC处理器
  registerIpcHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/**
 * 注册所有IPC处理器
 */
function registerIpcHandlers() {
  // 认证相关
  ipcMain.handle('auth:login', async (event, username, password) => {
    console.log('登录请求:', { username, password })
    const result = dataManager.userManager.validateUser(username, password)
    console.log('登录结果:', result)
    return result
  })

  ipcMain.handle('auth:updatePassword', async (event, userId, newPassword) => {
    return dataManager.userManager.updatePassword(userId, newPassword)
  })

  // 项目管理
  ipcMain.handle('projects:getAll', async () => {
    return dataManager.projectManager.getAllProjects()
  })

  ipcMain.handle('projects:create', async (event, projectData) => {
    return dataManager.projectManager.createProject(projectData)
  })

  ipcMain.handle('projects:update', async (event, projectId, projectData) => {
    return dataManager.projectManager.updateProject(projectId, projectData)
  })

  ipcMain.handle('projects:delete', async (event, projectId) => {
    return dataManager.projectManager.deleteProject(projectId)
  })

  // 题库管理
  ipcMain.handle('questions:getByProjectId', async (event, projectId) => {
    return dataManager.questionManager.getQuestionsByProjectId(projectId)
  })

  ipcMain.handle('questions:create', async (event, questionData) => {
    return dataManager.questionManager.createQuestion(questionData)
  })

  ipcMain.handle('questions:update', async (event, questionId, questionData) => {
    return dataManager.questionManager.updateQuestion(questionId, questionData)
  })

  ipcMain.handle('questions:delete', async (event, questionId) => {
    return dataManager.questionManager.deleteQuestion(questionId)
  })

  // 图片管理
  ipcMain.handle('images:save', async (event, imageBuffer, originalName) => {
    return dataManager.saveImage(imageBuffer, originalName)
  })

  ipcMain.handle('images:delete', async (event, relativePath) => {
    return dataManager.deleteImage(relativePath)
  })

  // 设置管理
  ipcMain.handle('settings:get', async (event, userId) => {
    return dataManager.userManager.getSettings(userId)
  })

  ipcMain.handle('settings:update', async (event, userId, settings) => {
    return dataManager.userManager.updateSettings(userId, settings)
  })

  // 考生管理
  ipcMain.handle('candidates:getAll', async () => {
    return dataManager.candidateManager.getAllCandidates()
  })

  ipcMain.handle('candidates:add', async (event, candidateData) => {
    return dataManager.candidateManager.addCandidate(candidateData)
  })

  ipcMain.handle('candidates:delete', async (event, idCard) => {
    return dataManager.candidateManager.deleteCandidate(idCard)
  })

  ipcMain.handle('candidates:clear', async () => {
    return dataManager.candidateManager.clearCandidates()
  })

  // 抽题功能
  ipcMain.handle('exam:drawQuestions', async (event, projectId, count) => {
    return dataManager.questionManager.drawQuestionsByProjectId(projectId, count)
  })

  // 工具类
  ipcMain.handle('utils:importFromExcel', async (event) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
      })

      if (canceled || filePaths.length === 0) {
        return { success: false, message: '未选择文件' }
      }

      // 这里需要添加Excel解析逻辑
      // 由于需要额外的库支持，我们先返回一个占位结果
      // 实际项目中需要安装并使用如xlsx库来解析Excel文件
      
      return { 
        success: true, 
        message: '导入成功', 
        filePath: filePaths[0],
        // 实际项目中，这里应该返回解析后的数据
        data: [] 
      }
    } catch (error) {
      console.error('导入Excel失败:', error)
      return { success: false, message: `导入失败: ${error.message}` }
    }
  })

  // 打印功能
  ipcMain.on('utils:printWindow', (event) => {
    const webContents = event.sender
    webContents.print({ silent: false, printBackground: true })
  })

  // 保留原有的ping测试
  ipcMain.on('ping', () => console.log('pong'))
}
