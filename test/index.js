var request = require('request')

var assert = require('assert')
var tap = require('./tap')
var setup = require('./setup')

setup(function (req, res) {
  res.end('hello')
}, function (proxy, done) {
  console.log('# hello')
  request.get(proxy, function (err, res, body) {
    tap(assert.equal, 'body is hello')(body, 'hello')
    done()
  })
})

setup(function (req, res) {
  res.end('goodbye')
}, function (proxy, done) {
  console.log('# goodbye')
  request.get(proxy, function (err, res, body) {
    tap(assert.equal, 'body is goodbye')(body, 'goodbye')
    done()
    tap.end()
  })
})




