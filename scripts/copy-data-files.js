import fs from 'fs'
import path from 'path'

// Copy JSON data files to output directory for deployment
export function copyDataFiles() {
  const sourceDir = path.join(process.cwd(), 'server/data')
  const outputServerDir = path.join(process.cwd(), '.output/server/server/data')
  const outputPublicDir = path.join(process.cwd(), '.output/public')
  
  // Ensure directories exist
  if (!fs.existsSync(outputServerDir)) {
    fs.mkdirSync(outputServerDir, { recursive: true })
  }
  
  // Copy files if they exist
  const filesToCopy = ['donors.json', 'servers.json', 'settings.json']
  
  filesToCopy.forEach(fileName => {
    const sourcePath = path.join(sourceDir, fileName)
    const serverDestPath = path.join(outputServerDir, fileName)
    const publicDestPath = path.join(outputPublicDir, fileName)
    
    if (fs.existsSync(sourcePath)) {
      // Copy to server directory
      fs.copyFileSync(sourcePath, serverDestPath)
      console.log(`✅ Copied ${fileName} to server directory`)
      
      // Copy to public directory
      fs.copyFileSync(sourcePath, publicDestPath)
      console.log(`✅ Copied ${fileName} to public directory`)
    } else {
      console.log(`⚠️  ${fileName} not found in source directory`)
    }
  })
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copyDataFiles()
}
