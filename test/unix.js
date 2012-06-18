var request = require('request')

var assert = require('assert')
var tap = require('./tap')
var setup = require('./setup')

setup(function (req, res) {
    res.end('hello')
  },function (proxy, done) {
    request.get(proxy, 
      function (err, res, body) {
          tap(assert.equal, 'error is null') (err, null)
          tap(assert.equal, 'body is "hello"')(body, 'hello')
          done()
          tap.end()
      })
  }, 
  {
    unix: true
  })

