const path = require('path')

module.exports = {
  entry: './browserAccounts.js',
  watch: true,
  output: {
    path: path.resolve(__dirname, 'public'), 
    filename: 'accounts.dist.js'
  },
}