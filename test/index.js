var request = require('request')
var assert = require('assert')
var tap = require('./tap')
var setup = require('./setup')
var http = require('http')
var parse = require('url').parse

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
  })
})

setup(function (req, res) {
  req.pipe(process.stderr, {end: false})
//  res.end('goodbye')
//  req.pipe(res)
}, function (proxy, done) {
  console.log('# kill client', parse(proxy))
  var url = parse(proxy) 
  url.method = 'post'
  var req = http.request(url)
  console.log('req', req)
/*  req.on('close', function () {
    console.log('request close')
    done()
  })*/
  req.on('response', function (res) {
    res.on('data', console.log)
    .on('end', function () {
      done()
    })
  })
  req.write('a 1\n')
  req.write('a 1\n')
  req.write('a 1\n')
  req.write('a 1\n')
  req.write('a 1\n')
  req.on('error', function (err) {
    console.log('client side error', err)
    done()
  })
  setTimeout(function () {
    req.destroy()
  }, 100)
//  req.end()
})


setup(function (req, res) {
  console.log('# unexpected disconnection')
/*  var i = 0
    , interval = setInterval(function () {
  res.write((i++) + '\n') 
  }, 10)*/
  setTimeout(function () {  
    console.log('closing server')
//    clearInterval(interval)
    res.destroy()
  }, 122) 
}, function (proxy, done) {
  console.log('# test server failure')
  request.get(proxy, function (err, res, body) {
    //this will not produce an error on the proxy
    tap(assert.equal, 'expect ECONNRESET')(err.code, 'ECONNRESET')
    done()
  })
})



