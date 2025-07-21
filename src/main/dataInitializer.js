/**
 * 数据文件初始化模块
 * 负责数据文件的检查、创建、验证和完整性保护
 * 实现需求: 5.1, 5.2
 */

import fs from 'fs'
import path from 'path'

// 应用根目录路径
let APP_ROOT = ''

// 在开发环境和生产环境中获取正确的应用根目录
if (process.env.NODE_ENV === 'development') {
  APP_ROOT = process.cwd()
} else {
  APP_ROOT = path.dirname(process.execPath)
}

// 数据目录路径
const DATA_DIR = path.join(APP_ROOT, 'data')
const DB_DIR = path.join(DATA_DIR, 'db')
const IMAGES_DIR = path.join(DATA_DIR, 'images')
const QUESTIONS_IMAGES_DIR = path.join(IMAGES_DIR, 'questions')

// 数据文件路径
const DATA_FILES = {
  users: path.join(DB_DIR, 'users.json'),
  projects: path.join(DB_DIR, 'projects.json'),
  questions: path.join(DB_DIR, 'questions.json'),
  candidates: path.join(DB_DIR, 'candidates.json')
}

/**
 * 默认数据结构生成器
 * 根据设计文档生成标准的数据结构
 */
class DefaultDataGenerator {
  /**
   * 生成默认用户数据结构
   * @returns {Object} 默认用户数据结构
   */
  static generateUsersStructure() {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      data: [
        {
          id: "usr_admin_01",
          username: "admin",
          password: "123123", // 生产环境应加密
          role: "admin",
          profile: {
            name: "系统管理员",
            email: "admin@example.com",
            phone: "",
            avatar: ""
          },
          settings: {
            defaultQuestionCount: 10,
            theme: "light",
            language: "zh-CN",
            autoSave: true,
            notifications: {
              email: true,
              system: true
            }
          },
          permissions: [
            "user:manage",
            "project:manage",
            "question:manage",
            "candidate:manage",
            "exam:manage",
            "system:config"
          ],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: null,
          loginCount: 0,
          metadata: {
            createdBy: "system",
            notes: "默认管理员账户"
          }
        }
      ]
    }
  }

  /**
   * 生成默认项目数据结构
   * @returns {Object} 默认项目数据结构
   */
  static generateProjectsStructure() {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      data: []
    }
  }

  /**
   * 生成默认题目数据结构
   * @returns {Object} 默认题目数据结构
   */
  static generateQuestionsStructure() {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      data: []
    }
  }

  /**
   * 生成默认考生数据结构
   * @returns {Object} 默认考生数据结构
   */
  static generateCandidatesStructure() {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      data: []
    }
  }
}

/**
 * 数据文件验证器
 * 验证数据文件的格式和完整性
 */
class DataFileValidator {
  /**
   * 验证JSON文件格式
   * @param {string} filePath - 文件路径
   * @returns {Object} 验证结果 {isValid: boolean, error?: string, data?: Object}
   */
  static validateJsonFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { isValid: false, error: '文件不存在' }
      }

      const content = fs.readFileSync(filePath, 'utf8')
      
      // 检查文件是否为空
      if (!content.trim()) {
        return { isValid: false, error: '文件为空' }
      }

      // 尝试解析JSON
      const data = JSON.parse(content)
      
      return { isValid: true, data }
    } catch (error) {
      return { isValid: false, error: `JSON解析错误: ${error.message}` }
    }
  }

  /**
   * 验证数据结构完整性
   * @param {Object} data - 数据对象
   * @param {string} type - 数据类型 (users/projects/questions/candidates)
   * @returns {Object} 验证结果 {isValid: boolean, error?: string}
   */
  static validateDataStructure(data, type) {
    try {
      // 检查基本结构
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: '数据不是有效的对象' }
      }

      // 检查版本信息
      if (!data.version) {
        return { isValid: false, error: '缺少版本信息' }
      }

      // 检查数据数组
      if (!Array.isArray(data.data)) {
        return { isValid: false, error: '数据字段必须是数组' }
      }

      // 根据类型进行特定验证
      switch (type) {
        case 'users':
          return this.validateUsersData(data.data)
        case 'projects':
          return this.validateProjectsData(data.data)
        case 'questions':
          return this.validateQuestionsData(data.data)
        case 'candidates':
          return this.validateCandidatesData(data.data)
        default:
          return { isValid: true }
      }
    } catch (error) {
      return { isValid: false, error: `结构验证错误: ${error.message}` }
    }
  }

  /**
   * 验证用户数据
   * @param {Array} users - 用户数据数组
   * @returns {Object} 验证结果
   */
  static validateUsersData(users) {
    for (const user of users) {
      if (!user.id || !user.username || !user.role) {
        return { isValid: false, error: '用户数据缺少必填字段 (id, username, role)' }
      }
      
      if (!['admin', 'candidate'].includes(user.role)) {
        return { isValid: false, error: `无效的用户角色: ${user.role}` }
      }
    }
    return { isValid: true }
  }

  /**
   * 验证项目数据
   * @param {Array} projects - 项目数据数组
   * @returns {Object} 验证结果
   */
  static validateProjectsData(projects) {
    for (const project of projects) {
      if (!project.id || !project.name) {
        return { isValid: false, error: '项目数据缺少必填字段 (id, name)' }
      }
    }
    return { isValid: true }
  }

  /**
   * 验证题目数据
   * @param {Array} questions - 题目数据数组
   * @returns {Object} 验证结果
   */
  static validateQuestionsData(questions) {
    for (const question of questions) {
      if (!question.id || !question.projectId || !question.content) {
        return { isValid: false, error: '题目数据缺少必填字段 (id, projectId, content)' }
      }
      
      if (!['text', 'image', 'mixed'].includes(question.type)) {
        return { isValid: false, error: `无效的题目类型: ${question.type}` }
      }
    }
    return { isValid: true }
  }

  /**
   * 验证考生数据
   * @param {Array} candidates - 考生数据数组
   * @returns {Object} 验证结果
   */
  static validateCandidatesData(candidates) {
    for (const candidate of candidates) {
      if (!candidate.id || !candidate.name || !candidate.idCard) {
        return { isValid: false, error: '考生数据缺少必填字段 (id, name, idCard)' }
      }
      
      // 验证身份证号格式
      if (!/^\d{17}[\dX]$/.test(candidate.idCard)) {
        return { isValid: false, error: `无效的身份证号格式: ${candidate.idCard}` }
      }
    }
    return { isValid: true }
  }
}

/**
 * 数据文件初始化器
 * 主要的初始化和管理类
 */
class DataFileInitializer {
  /**
   * 确保目录结构存在
   */
  static ensureDirectoriesExist() {
    const directories = [DATA_DIR, DB_DIR, IMAGES_DIR, QUESTIONS_IMAGES_DIR]
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true })
          console.log(`创建目录: ${dir}`)
        } catch (error) {
          console.error(`创建目录失败 ${dir}:`, error)
          throw new Error(`无法创建目录: ${dir}`)
        }
      }
    })
  }

  /**
   * 初始化单个数据文件
   * @param {string} type - 数据类型 (users/projects/questions/candidates)
   * @param {boolean} force - 是否强制重新创建
   * @returns {boolean} 是否成功
   */
  static initializeDataFile(type, force = false) {
    const filePath = DATA_FILES[type]
    
    if (!filePath) {
      console.error(`未知的数据类型: ${type}`)
      return false
    }

    try {
      // 如果文件存在且不强制重新创建，先验证文件
      if (fs.existsSync(filePath) && !force) {
        const validation = DataFileValidator.validateJsonFile(filePath)
        
        if (validation.isValid) {
          // 进一步验证数据结构
          const structureValidation = DataFileValidator.validateDataStructure(validation.data, type)
          
          if (structureValidation.isValid) {
            console.log(`数据文件 ${type}.json 已存在且有效`)
            return true
          } else {
            console.warn(`数据文件 ${type}.json 结构无效: ${structureValidation.error}`)
            // 结构无效时备份原文件并重新创建
            this.backupCorruptedFile(filePath)
          }
        } else {
          console.warn(`数据文件 ${type}.json 格式无效: ${validation.error}`)
          // 格式无效时备份原文件并重新创建
          this.backupCorruptedFile(filePath)
        }
      }

      // 生成默认数据结构
      let defaultData
      switch (type) {
        case 'users':
          defaultData = DefaultDataGenerator.generateUsersStructure()
          break
        case 'projects':
          defaultData = DefaultDataGenerator.generateProjectsStructure()
          break
        case 'questions':
          defaultData = DefaultDataGenerator.generateQuestionsStructure()
          break
        case 'candidates':
          defaultData = DefaultDataGenerator.generateCandidatesStructure()
          break
        default:
          console.error(`未知的数据类型: ${type}`)
          return false
      }

      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8')
      console.log(`${force ? '重新创建' : '创建'}数据文件: ${type}.json`)
      
      return true
    } catch (error) {
      console.error(`初始化数据文件 ${type}.json 失败:`, error)
      return false
    }
  }

  /**
   * 备份损坏的文件
   * @param {string} filePath - 文件路径
   */
  static backupCorruptedFile(filePath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = `${filePath}.backup.${timestamp}`
      
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath)
        console.log(`备份损坏文件到: ${backupPath}`)
      }
    } catch (error) {
      console.error('备份文件失败:', error)
    }
  }

  /**
   * 初始化所有数据文件
   * @param {boolean} force - 是否强制重新创建所有文件
   * @returns {Object} 初始化结果
   */
  static initializeAllDataFiles(force = false) {
    console.log('开始初始化数据文件...')
    
    const results = {
      success: true,
      initialized: [],
      failed: []
    }

    // 确保目录存在
    try {
      this.ensureDirectoriesExist()
    } catch (error) {
      console.error('创建目录失败:', error)
      results.success = false
      return results
    }

    // 初始化每个数据文件
    const dataTypes = ['users', 'projects', 'questions', 'candidates']
    
    for (const type of dataTypes) {
      const success = this.initializeDataFile(type, force)
      
      if (success) {
        results.initialized.push(type)
      } else {
        results.failed.push(type)
        results.success = false
      }
    }

    if (results.success) {
      console.log('所有数据文件初始化完成')
    } else {
      console.error('部分数据文件初始化失败:', results.failed)
    }

    return results
  }

  /**
   * 验证所有数据文件的完整性
   * @returns {Object} 验证结果
   */
  static validateAllDataFiles() {
    console.log('开始验证数据文件完整性...')
    
    const results = {
      success: true,
      valid: [],
      invalid: []
    }

    const dataTypes = ['users', 'projects', 'questions', 'candidates']
    
    for (const type of dataTypes) {
      const filePath = DATA_FILES[type]
      
      // 验证文件格式
      const fileValidation = DataFileValidator.validateJsonFile(filePath)
      
      if (!fileValidation.isValid) {
        results.invalid.push({ type, error: fileValidation.error })
        results.success = false
        continue
      }

      // 验证数据结构
      const structureValidation = DataFileValidator.validateDataStructure(fileValidation.data, type)
      
      if (structureValidation.isValid) {
        results.valid.push(type)
      } else {
        results.invalid.push({ type, error: structureValidation.error })
        results.success = false
      }
    }

    if (results.success) {
      console.log('所有数据文件验证通过')
    } else {
      console.error('数据文件验证失败:', results.invalid)
    }

    return results
  }

  /**
   * 修复损坏的数据文件
   * @returns {Object} 修复结果
   */
  static repairCorruptedFiles() {
    console.log('开始修复损坏的数据文件...')
    
    const validation = this.validateAllDataFiles()
    
    if (validation.success) {
      console.log('所有数据文件完整，无需修复')
      return { success: true, repaired: [] }
    }

    const results = {
      success: true,
      repaired: [],
      failed: []
    }

    // 修复每个损坏的文件
    for (const invalid of validation.invalid) {
      console.log(`修复数据文件: ${invalid.type}.json (错误: ${invalid.error})`)
      
      const success = this.initializeDataFile(invalid.type, true)
      
      if (success) {
        results.repaired.push(invalid.type)
      } else {
        results.failed.push(invalid.type)
        results.success = false
      }
    }

    if (results.success) {
      console.log('数据文件修复完成')
    } else {
      console.error('部分数据文件修复失败:', results.failed)
    }

    return results
  }

  /**
   * 获取数据文件信息
   * @returns {Object} 文件信息
   */
  static getDataFilesInfo() {
    const info = {
      directories: {
        dataDir: DATA_DIR,
        dbDir: DB_DIR,
        imagesDir: IMAGES_DIR,
        questionsImagesDir: QUESTIONS_IMAGES_DIR
      },
      files: {}
    }

    for (const [type, filePath] of Object.entries(DATA_FILES)) {
      const exists = fs.existsSync(filePath)
      let size = 0
      let lastModified = null

      if (exists) {
        try {
          const stats = fs.statSync(filePath)
          size = stats.size
          lastModified = stats.mtime.toISOString()
        } catch (error) {
          console.error(`获取文件信息失败 ${filePath}:`, error)
        }
      }

      info.files[type] = {
        path: filePath,
        exists,
        size,
        lastModified
      }
    }

    return info
  }
}

// 导出主要功能
export {
  DataFileInitializer,
  DefaultDataGenerator,
  DataFileValidator,
  DATA_FILES,
  DATA_DIR,
  DB_DIR,
  IMAGES_DIR,
  QUESTIONS_IMAGES_DIR
}

// 默认导出初始化器
export default DataFileInitializer