/**
 * 数据文件初始化模块测试
 * 测试数据文件检查、创建、验证和完整性保护功能
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import DataFileInitializer, { 
  DefaultDataGenerator, 
  DataFileValidator,
  DATA_FILES 
} from './dataInitializer.js'

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试用的临时目录
const TEST_DATA_DIR = path.join(__dirname, '../../test-data')
const TEST_DB_DIR = path.join(TEST_DATA_DIR, 'db')

/**
 * 测试工具函数
 */
class TestUtils {
  /**
   * 创建测试目录
   */
  static setupTestEnvironment() {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
    fs.mkdirSync(TEST_DB_DIR, { recursive: true })
  }

  /**
   * 清理测试目录
   */
  static cleanupTestEnvironment() {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
    }
  }

  /**
   * 创建损坏的JSON文件
   * @param {string} filePath - 文件路径
   * @param {string} content - 损坏的内容
   */
  static createCorruptedFile(filePath, content = '{ invalid json') {
    fs.writeFileSync(filePath, content, 'utf8')
  }

  /**
   * 创建空文件
   * @param {string} filePath - 文件路径
   */
  static createEmptyFile(filePath) {
    fs.writeFileSync(filePath, '', 'utf8')
  }
}

/**
 * 测试默认数据结构生成器
 */
function testDefaultDataGenerator() {
  console.log('\n=== 测试默认数据结构生成器 ===')
  
  try {
    // 测试用户数据结构生成
    const usersData = DefaultDataGenerator.generateUsersStructure()
    console.log('✓ 用户数据结构生成成功')
    
    // 验证用户数据结构
    if (!usersData.version || !usersData.data || !Array.isArray(usersData.data)) {
      throw new Error('用户数据结构不完整')
    }
    
    if (usersData.data.length === 0 || !usersData.data[0].id || usersData.data[0].role !== 'admin') {
      throw new Error('默认管理员账户未正确生成')
    }
    console.log('✓ 用户数据结构验证通过')

    // 测试项目数据结构生成
    const projectsData = DefaultDataGenerator.generateProjectsStructure()
    console.log('✓ 项目数据结构生成成功')
    
    if (!projectsData.version || !Array.isArray(projectsData.data)) {
      throw new Error('项目数据结构不完整')
    }
    console.log('✓ 项目数据结构验证通过')

    // 测试题目数据结构生成
    const questionsData = DefaultDataGenerator.generateQuestionsStructure()
    console.log('✓ 题目数据结构生成成功')
    
    if (!questionsData.version || !Array.isArray(questionsData.data)) {
      throw new Error('题目数据结构不完整')
    }
    console.log('✓ 题目数据结构验证通过')

    // 测试考生数据结构生成
    const candidatesData = DefaultDataGenerator.generateCandidatesStructure()
    console.log('✓ 考生数据结构生成成功')
    
    if (!candidatesData.version || !Array.isArray(candidatesData.data)) {
      throw new Error('考生数据结构不完整')
    }
    console.log('✓ 考生数据结构验证通过')

    console.log('✅ 默认数据结构生成器测试通过')
    return true
  } catch (error) {
    console.error('❌ 默认数据结构生成器测试失败:', error.message)
    return false
  }
}

/**
 * 测试数据文件验证器
 */
function testDataFileValidator() {
  console.log('\n=== 测试数据文件验证器 ===')
  
  try {
    TestUtils.setupTestEnvironment()
    
    // 测试不存在的文件
    const nonExistentFile = path.join(TEST_DB_DIR, 'nonexistent.json')
    let validation = DataFileValidator.validateJsonFile(nonExistentFile)
    if (validation.isValid) {
      throw new Error('不存在的文件应该验证失败')
    }
    console.log('✓ 不存在文件验证正确')

    // 测试空文件
    const emptyFile = path.join(TEST_DB_DIR, 'empty.json')
    TestUtils.createEmptyFile(emptyFile)
    validation = DataFileValidator.validateJsonFile(emptyFile)
    if (validation.isValid) {
      throw new Error('空文件应该验证失败')
    }
    console.log('✓ 空文件验证正确')

    // 测试损坏的JSON文件
    const corruptedFile = path.join(TEST_DB_DIR, 'corrupted.json')
    TestUtils.createCorruptedFile(corruptedFile)
    validation = DataFileValidator.validateJsonFile(corruptedFile)
    if (validation.isValid) {
      throw new Error('损坏的JSON文件应该验证失败')
    }
    console.log('✓ 损坏JSON文件验证正确')

    // 测试有效的JSON文件
    const validFile = path.join(TEST_DB_DIR, 'valid.json')
    const validData = DefaultDataGenerator.generateUsersStructure()
    fs.writeFileSync(validFile, JSON.stringify(validData, null, 2), 'utf8')
    validation = DataFileValidator.validateJsonFile(validFile)
    if (!validation.isValid) {
      throw new Error('有效的JSON文件应该验证通过')
    }
    console.log('✓ 有效JSON文件验证正确')

    // 测试数据结构验证
    const structureValidation = DataFileValidator.validateDataStructure(validData, 'users')
    if (!structureValidation.isValid) {
      throw new Error('有效的用户数据结构应该验证通过')
    }
    console.log('✓ 数据结构验证正确')

    // 测试无效的数据结构
    const invalidData = { version: '1.0.0', data: 'not an array' }
    const invalidValidation = DataFileValidator.validateDataStructure(invalidData, 'users')
    if (invalidValidation.isValid) {
      throw new Error('无效的数据结构应该验证失败')
    }
    console.log('✓ 无效数据结构验证正确')

    TestUtils.cleanupTestEnvironment()
    console.log('✅ 数据文件验证器测试通过')
    return true
  } catch (error) {
    TestUtils.cleanupTestEnvironment()
    console.error('❌ 数据文件验证器测试失败:', error.message)
    return false
  }
}

/**
 * 测试数据文件初始化器
 */
function testDataFileInitializer() {
  console.log('\n=== 测试数据文件初始化器 ===')
  
  try {
    // 测试目录创建
    TestUtils.setupTestEnvironment()
    DataFileInitializer.ensureDirectoriesExist()
    console.log('✓ 目录创建成功')

    // 测试获取文件信息
    const fileInfo = DataFileInitializer.getDataFilesInfo()
    if (!fileInfo.directories || !fileInfo.files) {
      throw new Error('文件信息获取失败')
    }
    console.log('✓ 文件信息获取成功')

    // 测试初始化所有数据文件
    const initResult = DataFileInitializer.initializeAllDataFiles()
    if (!initResult.success) {
      throw new Error('数据文件初始化失败: ' + JSON.stringify(initResult.failed))
    }
    console.log('✓ 所有数据文件初始化成功')

    // 验证文件是否存在
    for (const [type, filePath] of Object.entries(DATA_FILES)) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`数据文件不存在: ${type}.json`)
      }
    }
    console.log('✓ 所有数据文件已创建')

    // 测试文件完整性验证
    const validationResult = DataFileInitializer.validateAllDataFiles()
    if (!validationResult.success) {
      throw new Error('数据文件验证失败: ' + JSON.stringify(validationResult.invalid))
    }
    console.log('✓ 数据文件完整性验证通过')

    // 测试强制重新初始化
    const forceInitResult = DataFileInitializer.initializeAllDataFiles(true)
    if (!forceInitResult.success) {
      throw new Error('强制重新初始化失败')
    }
    console.log('✓ 强制重新初始化成功')

    console.log('✅ 数据文件初始化器测试通过')
    return true
  } catch (error) {
    console.error('❌ 数据文件初始化器测试失败:', error.message)
    return false
  }
}

/**
 * 测试损坏文件修复功能
 */
function testCorruptedFileRepair() {
  console.log('\n=== 测试损坏文件修复功能 ===')
  
  try {
    // 创建损坏的文件
    const usersFile = DATA_FILES.users
    TestUtils.createCorruptedFile(usersFile, '{ "invalid": json }')
    console.log('✓ 创建损坏文件')

    // 测试修复功能
    const repairResult = DataFileInitializer.repairCorruptedFiles()
    if (!repairResult.success) {
      throw new Error('文件修复失败: ' + JSON.stringify(repairResult.failed))
    }
    console.log('✓ 损坏文件修复成功')

    // 验证修复后的文件
    const validation = DataFileValidator.validateJsonFile(usersFile)
    if (!validation.isValid) {
      throw new Error('修复后的文件仍然无效')
    }
    console.log('✓ 修复后文件验证通过')

    console.log('✅ 损坏文件修复功能测试通过')
    return true
  } catch (error) {
    console.error('❌ 损坏文件修复功能测试失败:', error.message)
    return false
  }
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 开始运行数据初始化模块测试...')
  
  const tests = [
    { name: '默认数据结构生成器', fn: testDefaultDataGenerator },
    { name: '数据文件验证器', fn: testDataFileValidator },
    { name: '数据文件初始化器', fn: testDataFileInitializer },
    { name: '损坏文件修复功能', fn: testCorruptedFileRepair }
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    if (test.fn()) {
      passedTests++
    }
  }

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`)
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！')
    return true
  } else {
    console.log('❌ 部分测试失败')
    return false
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}

export { runAllTests }