import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Check authentication
  const body = await readBody(event)
  if (!body.password || body.password !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const method = getMethod(event)
  
  if (method === 'POST') {
    const { action, fileType, data } = body
    
    try {
      if (action === 'create' || action === 'update') {
        let filePath
        let fileName
        
        if (fileType === 'donors') {
          fileName = 'donors.json'
          filePath = path.join(process.cwd(), 'server/data/donors.json')
          
          // Also create in public for static deployment
          const publicPath = path.join(process.cwd(), 'public/donors.json')
          fs.writeFileSync(publicPath, JSON.stringify(data, null, 2))
          
        } else if (fileType === 'servers') {
          fileName = 'servers.json'
          filePath = path.join(process.cwd(), 'server/data/servers.json')
          
          // Also create in public for static deployment
          const publicPath = path.join(process.cwd(), 'public/servers.json')
          fs.writeFileSync(publicPath, JSON.stringify(data, null, 2))
          
        } else {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid file type'
          })
        }
        
        // Write to server/data directory
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        
        return {
          success: true,
          message: `${fileName} ${action}d successfully`,
          filePath: filePath
        }
      }
      
      if (action === 'read') {
        let filePath
        let defaultData

        if (fileType === 'donors') {
          filePath = path.join(process.cwd(), 'server/data/donors.json')
          defaultData = { donors: [] }
        } else if (fileType === 'servers') {
          filePath = path.join(process.cwd(), 'server/data/servers.json')
          defaultData = { servers: [] }
        } else {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid file type'
          })
        }

        if (fs.existsSync(filePath)) {
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            return {
              success: true,
              data: JSON.parse(fileContent)
            }
          } catch (error) {
            console.error('Error reading file:', error)
            return {
              success: true,
              data: defaultData
            }
          }
        } else {
          // Create default file if it doesn't exist
          const dataDir = path.dirname(filePath)
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
          }
          fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2))

          return {
            success: true,
            data: defaultData
          }
        }
      }
      
    } catch (error) {
      console.error('File operation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'File operation failed'
      })
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
