/**
 * 数据管理器 - 负责所有JSON文件的读写操作和图片文件管理
 * 为整个应用提供统一的数据访问接口
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// 应用根目录路径
let APP_ROOT = ''

// 在开发环境和生产环境中获取正确的应用根目录
if (process.env.NODE_ENV === 'development') {
  // 开发环境下，使用项目根目录
  APP_ROOT = process.cwd()
} else {
  // 生产环境下，使用应用程序所在目录
  APP_ROOT = path.dirname(process.execPath)
}

// 数据目录路径
const DATA_DIR = path.join(APP_ROOT, 'data')
const DB_DIR = path.join(DATA_DIR, 'db')
const IMAGES_DIR = path.join(DATA_DIR, 'images')

// 确保数据目录存在
function ensureDirectoriesExist() {
  const dirs = [DATA_DIR, DB_DIR, IMAGES_DIR]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// 初始化数据文件
function initDataFiles() {
  const dataFiles = [
    { path: path.join(DB_DIR, 'users.json'), defaultContent: '[]' },
    { path: path.join(DB_DIR, 'projects.json'), defaultContent: '[]' },
    { path: path.join(DB_DIR, 'questions.json'), defaultContent: '[]' },
    { path: path.join(DB_DIR, 'candidates.json'), defaultContent: '[]' }
  ]
  
  dataFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.defaultContent, 'utf8')
    }
  })
  
  // 初始化默认管理员账户
  const usersPath = path.join(DB_DIR, 'users.json')
  let users = []
  
  try {
    const usersData = fs.readFileSync(usersPath, 'utf8')
    users = JSON.parse(usersData)
  } catch (error) {
    users = []
  }
  
  // 如果没有管理员账户，创建默认账户
  if (!users.some(user => user.role === 'admin')) {
    users.push({
      id: 'usr_admin_01',
      username: 'admin',
      password: '123123', // 实际生产环境应该加密
      role: 'admin',
      settings: {
        defaultQuestionCount: 10
      }
    })
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8')
  }
}

/**
 * 读取JSON文件
 * @param {string} fileName - 不带路径的文件名，如 'users.json'
 * @returns {Array|Object} 解析后的JSON数据
 */
function readJsonFile(fileName) {
  const filePath = path.join(DB_DIR, fileName)
  
  try {
    if (!fs.existsSync(filePath)) {
      return []
    }
    
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`读取文件 ${fileName} 失败:`, error)
    return []
  }
}

/**
 * 写入JSON文件
 * @param {string} fileName - 不带路径的文件名，如 'users.json'
 * @param {Array|Object} data - 要写入的数据
 * @returns {boolean} 是否成功
 */
function writeJsonFile(fileName, data) {
  const filePath = path.join(DB_DIR, fileName)
  
  try {
    // 确保目录存在
    ensureDirectoriesExist()
    
    // 格式化JSON，使用2个空格缩进，便于人类阅读
    const jsonString = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, jsonString, 'utf8')
    return true
  } catch (error) {
    console.error(`写入文件 ${fileName} 失败:`, error)
    return false
  }
}

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀，如 'usr_', 'proj_'
 * @returns {string} 生成的唯一ID
 */
export function generateId(prefix) {
  const timestamp = Date.now()
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${randomPart}`
}

/**
 * 格式化当前日期时间为字符串
 * @returns {string} 格式化的日期时间，如 "2025/06/12 23:17:34"
 */
export function formatDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 保存上传的图片
 * @param {Buffer} imageBuffer - 图片数据
 * @param {string} originalName - 原始文件名
 * @returns {string|null} 保存后的图片相对路径，失败返回null
 */
export function saveImage(imageBuffer, originalName) {
  try {
    // 确保目录存在
    ensureDirectoriesExist()
    
    // 获取文件扩展名
    const ext = path.extname(originalName).toLowerCase()
    
    // 生成安全的文件名
    const timestamp = Date.now()
    const nameHash = crypto
      .createHash('md5')
      .update(originalName + timestamp)
      .digest('hex')
      .substring(0, 8)
    
    const newFileName = `qimg_${timestamp}_${nameHash}${ext}`
    const imagePath = path.join(IMAGES_DIR, newFileName)
    
    // 写入文件
    fs.writeFileSync(imagePath, imageBuffer)
    
    // 返回相对路径
    return path.relative(DATA_DIR, imagePath).replace(/\\/g, '/')
  } catch (error) {
    console.error('保存图片失败:', error)
    return null
  }
}

/**
 * 删除图片
 * @param {string} relativePath - 图片的相对路径
 * @returns {boolean} 是否成功删除
 */
export function deleteImage(relativePath) {
  try {
    if (!relativePath) return true
    
    const imagePath = path.join(DATA_DIR, relativePath)
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
    
    return true
  } catch (error) {
    console.error('删除图片失败:', error)
    return false
  }
}

// 用户相关操作
export const userManager = {
  // ... (userManager 内部所有函数保持不变)
  getAllUsers() {
    return readJsonFile('users.json')
  },
  validateUser(username, password) {
    const users = this.getAllUsers()
    console.log('验证用户:', { username, password })
    console.log('所有用户:', users)
    
    // 如果是admin用户，直接使用users.json中的账号密码验证
    if (username === 'admin') {
      const adminUser = users.find(u => u.username === 'admin' && u.password === password)
      if (adminUser) {
        console.log('管理员登录成功')
        return { success: true, user: adminUser }
      }
    } else {
      // 其他用户正常验证
      const user = users.find(u => u.username === username && u.password === password)
      if (user) {
        console.log('用户登录成功:', user)
        return { success: true, user }
      }
    }
    
    console.log('登录失败: 用户名或密码错误')
    return { success: false, message: '用户名或密码错误' }
  },
  updatePassword(userId, newPassword) {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) return false
    users[userIndex].password = newPassword
    return writeJsonFile('users.json', users)
  },
  updateSettings(userId, settings) {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) return false
    users[userIndex].settings = { ...users[userIndex].settings, ...settings }
    return writeJsonFile('users.json', users)
  },
  getSettings(userId) {
    const users = this.getAllUsers()
    const user = users.find(u => u.id === userId)
    return user ? user.settings : null
  },
  addCandidateUser(candidate) {
    const users = this.getAllUsers()
    const existingUser = users.find(u => u.role === 'candidate' && u.idCard === candidate.idCard)
    if (existingUser) return existingUser
    const newUser = {
      id: generateId('usr_candidate_'),
      username: candidate.name,
      idCard: candidate.idCard,
      password: candidate.idCard.substring(candidate.idCard.length - 6),
      role: 'candidate'
    }
    users.push(newUser)
    writeJsonFile('users.json', users)
    return newUser
  }
}

// 项目相关操作
export const projectManager = {
  // ... (projectManager 内部所有函数保持不变)
  getAllProjects() {
    return readJsonFile('projects.json')
  },
  getProject(projectId) {
    const projects = this.getAllProjects()
    return projects.find(p => p.id === projectId) || null
  },
  createProject(projectData) {
    const projects = this.getAllProjects()
    const newProject = {
      id: generateId('proj_'),
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'active',
      createdAt: formatDateTime()
    }
    projects.push(newProject)
    writeJsonFile('projects.json', projects)
    return newProject
  },
  updateProject(projectId, projectData) {
    const projects = this.getAllProjects()
    const projectIndex = projects.findIndex(p => p.id === projectId)
    if (projectIndex === -1) return null
    projects[projectIndex] = {
      ...projects[projectIndex],
      name: projectData.name || projects[projectIndex].name,
      description: projectData.description || projects[projectIndex].description,
      status: projectData.status || projects[projectIndex].status
    }
    writeJsonFile('projects.json', projects)
    return projects[projectIndex]
  },
  deleteProject(projectId) {
    const projects = this.getAllProjects()
    const filteredProjects = projects.filter(p => p.id !== projectId)
    if (filteredProjects.length === projects.length) {
      return false
    }
    questionManager.deleteQuestionsByProjectId(projectId)
    return writeJsonFile('projects.json', filteredProjects)
  }
}

// 题目相关操作
export const questionManager = {
  // ... (questionManager 内部所有函数保持不变)
  getAllQuestions() {
    return readJsonFile('questions.json')
  },
  getQuestionsByProjectId(projectId) {
    const questions = this.getAllQuestions()
    return questions.filter(q => q.projectId === projectId)
  },
  createQuestion(questionData) {
    const questions = this.getAllQuestions()
    const newQuestion = {
      id: generateId('ques_'),
      projectId: questionData.projectId,
      type: questionData.type || 'text',
      content: questionData.content || '',
      imageUrl: questionData.imageUrl || null,
      isMandatory: questionData.isMandatory || false,
      createdAt: formatDateTime()
    }
    questions.push(newQuestion)
    writeJsonFile('questions.json', questions)
    return newQuestion
  },
  updateQuestion(questionId, questionData) {
    const questions = this.getAllQuestions()
    const questionIndex = questions.findIndex(q => q.id === questionId)
    if (questionIndex === -1) return null
    const oldQuestion = questions[questionIndex]
    if (questionData.imageUrl !== undefined && oldQuestion.imageUrl && questionData.imageUrl !== oldQuestion.imageUrl) {
      deleteImage(oldQuestion.imageUrl)
    }
    questions[questionIndex] = {
      ...oldQuestion,
      projectId: questionData.projectId || oldQuestion.projectId,
      type: questionData.type || oldQuestion.type,
      content: questionData.content !== undefined ? questionData.content : oldQuestion.content,
      imageUrl: questionData.imageUrl !== undefined ? questionData.imageUrl : oldQuestion.imageUrl,
      isMandatory: questionData.isMandatory !== undefined ? questionData.isMandatory : oldQuestion.isMandatory
    }
    writeJsonFile('questions.json', questions)
    return questions[questionIndex]
  },
  deleteQuestion(questionId) {
    const questions = this.getAllQuestions()
    const questionToDelete = questions.find(q => q.id === questionId)
    if (!questionToDelete) return false
    if (questionToDelete.imageUrl) {
      deleteImage(questionToDelete.imageUrl)
    }
    const filteredQuestions = questions.filter(q => q.id !== questionId)
    return writeJsonFile('questions.json', filteredQuestions)
  },
  deleteQuestionsByProjectId(projectId) {
    const questions = this.getAllQuestions()
    const questionsToDelete = questions.filter(q => q.projectId === projectId)
    questionsToDelete.forEach(question => {
      if (question.imageUrl) {
        deleteImage(question.imageUrl)
      }
    })
    const remainingQuestions = questions.filter(q => q.projectId !== projectId)
    return writeJsonFile('questions.json', remainingQuestions)
  },
  drawQuestionsByProjectId(projectId, count) {
    const allQuestions = this.getQuestionsByProjectId(projectId)
    if (allQuestions.length <= count) {
      return allQuestions
    }
    const mandatoryQuestions = allQuestions.filter(q => q.isMandatory)
    const optionalQuestions = allQuestions.filter(q => !q.isMandatory)
    if (mandatoryQuestions.length >= count) {
      return shuffleArray(mandatoryQuestions).slice(0, count)
    }
    const result = [...mandatoryQuestions]
    const remainingCount = count - mandatoryQuestions.length
    const shuffledOptional = shuffleArray(optionalQuestions)
    return [...result, ...shuffledOptional.slice(0, remainingCount)]
  }
}

// 考生相关操作
export const candidateManager = {
  // ... (candidateManager 内部所有函数保持不变)
  getAllCandidates() {
    return readJsonFile('candidates.json')
  },
  addCandidate(candidateData) {
    const candidates = this.getAllCandidates()
    const exists = candidates.some(c => c.idCard === candidateData.idCard)
    if (exists) return false
    candidates.push({
      name: candidateData.name,
      idCard: candidateData.idCard,
      projectName: candidateData.projectName
    })
    return writeJsonFile('candidates.json', candidates)
  },
  addCandidatesBatch(candidatesData) {
    const candidates = this.getAllCandidates()
    const existingIdCards = new Set(candidates.map(c => c.idCard))
    const newCandidates = candidatesData.filter(c => !existingIdCards.has(c.idCard))
    const updatedCandidates = [...candidates, ...newCandidates]
    return writeJsonFile('candidates.json', updatedCandidates)
  },
  deleteCandidate(idCard) {
    const candidates = this.getAllCandidates()
    const filteredCandidates = candidates.filter(c => c.idCard !== idCard)
    if (filteredCandidates.length === candidates.length) {
      return false
    }
    return writeJsonFile('candidates.json', filteredCandidates)
  },
  clearCandidates() {
    return writeJsonFile('candidates.json', [])
  }
}

/**
 * 打乱数组顺序（Fisher-Yates洗牌算法）
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// 初始化数据目录和文件
ensureDirectoriesExist()
initDataFiles()
