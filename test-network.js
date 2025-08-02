#!/usr/bin/env node

const https = require('https')
const http = require('http')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xstmlowercjuvqkhfbpk.supabase.co'

function testConnection(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const req = protocol.get(url, { timeout }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Connection timeout after ${timeout}ms`))
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}

async function runTests() {
  console.log('🔍 Testing network connectivity...\n')

  const tests = [
    {
      name: 'Supabase URL',
      url: SUPABASE_URL,
      description: 'Testing connection to Supabase'
    },
    {
      name: 'Health Check',
      url: 'http://localhost:3000/api/health',
      description: 'Testing local health endpoint'
    },
    {
      name: 'Google DNS',
      url: 'https://8.8.8.8',
      description: 'Testing general internet connectivity'
    }
  ]

  for (const test of tests) {
    console.log(`📡 Testing: ${test.name}`)
    console.log(`   ${test.description}`)
    console.log(`   URL: ${test.url}`)
    
    try {
      const startTime = Date.now()
      const result = await testConnection(test.url, 15000)
      const responseTime = Date.now() - startTime
      
      console.log(`   ✅ Success (${responseTime}ms)`)
      console.log(`   Status: ${result.status}`)
      
      if (test.name === 'Health Check' && result.data) {
        try {
          const healthData = JSON.parse(result.data)
          console.log(`   Health: ${healthData.status}`)
          if (healthData.database) {
            console.log(`   Database: ${healthData.database}`)
          }
        } catch (e) {
          console.log(`   Response: ${result.data.substring(0, 100)}...`)
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🏁 Network test completed!')
}

if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testConnection, runTests } 