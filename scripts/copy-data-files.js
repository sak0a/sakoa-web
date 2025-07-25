import fs from 'fs'
import path from 'path'

// Copy JSON data files to output directory for deployment
export function copyDataFiles() {
  console.log('🔍 DEBUG: Starting copyDataFiles function')

  const sourceDir = path.join(process.cwd(), 'server/data')
  const outputServerDir = path.join(process.cwd(), '.output/server/server/data')
  const outputPublicDir = path.join(process.cwd(), '.output/public')

  console.log('🔍 DEBUG: Paths configured:')
  console.log(`  - Source: ${sourceDir}`)
  console.log(`  - Server output: ${outputServerDir}`)
  console.log(`  - Public output: ${outputPublicDir}`)

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.log(`❌ Source directory does not exist: ${sourceDir}`)
    return
  }
  console.log('✅ Source directory exists')

  // Ensure directories exist
  console.log('🔍 DEBUG: Creating output directories...')
  if (!fs.existsSync(outputServerDir)) {
    fs.mkdirSync(outputServerDir, { recursive: true })
    console.log('✅ Created server output directory')
  } else {
    console.log('✅ Server output directory already exists')
  }

  if (!fs.existsSync(outputPublicDir)) {
    fs.mkdirSync(outputPublicDir, { recursive: true })
    console.log('✅ Created public output directory')
  } else {
    console.log('✅ Public output directory already exists')
  }

  // Copy files if they exist
  const filesToCopy = ['donors.json', 'servers.json', 'settings.json']
  console.log(`🔍 DEBUG: Processing ${filesToCopy.length} files...`)

  filesToCopy.forEach((fileName, index) => {
    console.log(`🔍 DEBUG: Processing file ${index + 1}/${filesToCopy.length}: ${fileName}`)

    const sourcePath = path.join(sourceDir, fileName)
    const serverDestPath = path.join(outputServerDir, fileName)
    const publicDestPath = path.join(outputPublicDir, fileName)

    console.log(`🔍 DEBUG: Checking if source file exists: ${sourcePath}`)

    if (fs.existsSync(sourcePath)) {
      console.log(`✅ Source file exists: ${fileName}`)

      try {
        // Copy to server directory
        console.log(`🔍 DEBUG: Copying ${fileName} to server directory...`)
        fs.copyFileSync(sourcePath, serverDestPath)
        console.log(`✅ Copied ${fileName} to server directory`)

        // Copy to public directory
        console.log(`🔍 DEBUG: Copying ${fileName} to public directory...`)
        fs.copyFileSync(sourcePath, publicDestPath)
        console.log(`✅ Copied ${fileName} to public directory`)
      } catch (error) {
        console.error(`❌ Error copying ${fileName}:`, error)
      }
    } else {
      console.log(`⚠️  ${fileName} not found in source directory`)
    }

    console.log(`🔍 DEBUG: Finished processing ${fileName}`)
  })

  console.log('🔍 DEBUG: copyDataFiles function completed')
}

// Run if called directly
console.log('🔍 DEBUG: Script started')
console.log('🔍 DEBUG: import.meta.url:', import.meta.url)
console.log('🔍 DEBUG: process.argv[1]:', process.argv[1])
console.log('🔍 DEBUG: Comparison result:', import.meta.url === `file://${process.argv[1]}`)

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 DEBUG: Entering main execution block')
  try {
    console.log('🔍 DEBUG: About to call copyDataFiles()')
    copyDataFiles()
    console.log('🔍 DEBUG: copyDataFiles() returned')
    console.log('✅ Data files copy completed successfully')
    console.log('🔍 DEBUG: Script completed, exiting naturally')
    // Let the script exit naturally instead of forcing process.exit()
  } catch (error) {
    console.error('❌ Error copying data files:', error)
    console.log('🔍 DEBUG: About to exit with code 1 due to error')
    process.exit(1)
  }
} else {
  console.log('🔍 DEBUG: Script was imported, not executed directly')
}
