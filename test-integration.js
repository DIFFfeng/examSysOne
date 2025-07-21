import { userManager, projectManager } from './src/main/dataManager.js'

console.log('Testing integration with dataManager...')

try {
  // Test reading users (should work with both old and new format)
  const users = userManager.getAllUsers()
  console.log('Users loaded:', users.length)
  console.log('First user:', users[0])
  
  // Test reading projects
  const projects = projectManager.getAllProjects()
  console.log('Projects loaded:', projects.length)
  
  // Test creating a new project
  const newProject = projectManager.createProject({
    name: '测试项目',
    description: '这是一个测试项目'
  })
  console.log('Created project:', newProject)
  
  // Verify the project was saved
  const allProjects = projectManager.getAllProjects()
  console.log('Total projects after creation:', allProjects.length)
  
  console.log('✅ Integration test completed successfully')
} catch (error) {
  console.error('❌ Integration test failed:', error)
}