const path = require('path')

module.exports = {
  entry: './browserAccounts.js',
  output: {
    path: __dirname, 
    filename: 'accounts.dist.js'
  },
}