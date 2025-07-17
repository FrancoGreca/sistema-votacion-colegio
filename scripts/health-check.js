const http = require('http')

const healthCheck = async () => {
  const options = {
    hostname: process.env.HEALTH_CHECK_HOST || 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/candidates',
    method: 'GET',
    timeout: 5000
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Health check passed')
        resolve(true)
      } else {
        console.error('❌ Health check failed:', res.statusCode)
        reject(new Error('Health check failed'))
      }
    })

    req.on('error', (error) => {
      console.error('❌ Health check error:', error)
      reject(error)
    })

    req.setTimeout(5000)
    req.end()
  })
}

if (require.main === module) {
  healthCheck()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { healthCheck }