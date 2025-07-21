import DataFileInitializer from './src/main/dataInitializer.js'

console.log('Testing data initializer...')

try {
  // Test initialization
  const result = DataFileInitializer.initializeAllDataFiles()
  console.log('Initialization result:', result)
  
  // Test validation
  const validation = DataFileInitializer.validateAllDataFiles()
  console.log('Validation result:', validation)
  
  // Test file info
  const info = DataFileInitializer.getDataFilesInfo()
  console.log('File info:', JSON.stringify(info, null, 2))
  
  console.log('✅ Data initializer test completed successfully')
} catch (error) {
  console.error('❌ Test failed:', error)
}