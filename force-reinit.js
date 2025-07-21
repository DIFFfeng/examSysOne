import DataFileInitializer from './src/main/dataInitializer.js'

console.log('Force reinitializing data files with new structure...')

try {
  // Force reinitialize all data files
  const result = DataFileInitializer.initializeAllDataFiles(true)
  console.log('Force initialization result:', result)
  
  console.log('✅ Force reinitialization completed successfully')
} catch (error) {
  console.error('❌ Force reinitialization failed:', error)
}