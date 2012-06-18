module.exports = setup

var http = require('http')
var badass = require('..')
var assert = require('assert')
var tap = require('./tap')

function rand () {
  return ~~(1000 + Math.random()*40000)
}

var tests = []
function setup (sHandler, request, options) {
  options = options || {}
  tests.push(function () {
    var sPort = rand()
      , sPath = '/tmp/sPath_'+rand()
      , pPort = rand()
      , incoming, outgoing, _dest, serverAddy
    var server = http.createServer(function (req, res) {
      serverCalled = true
      sHandler(req, res)
    })
    var proxy = badass.createServer(function lookup (req) {
      incoming = true
      return _dest = (options.unix ? {path: sPath} : {port: sPort, host: 'localhost'})
    }, function modify (res, dest) {
      //optionally modify the response 
      //header before sending back
      //to client. for example, 
      //add a cookie for sticky sessions.
      outgoing = true 
      tap(assert.strictEqual, 'dest reference passed')(dest, _dest)
    }, function (err, dest) {
      outgoing = true 
      tap(assert.strictEqual, 'dest reference passed')(dest, _dest)
    })

    server.listen(serverAddy = options.unix ? sPath : sPort, function () {
      console.log('# server listening on', serverAddy) 
      proxy.listen (pPort, function () {
        request('http://localhost:'+pPort, function () {
          tap(assert.ok, 'incoming side called')(incoming, 'incoming')
          tap(assert.ok, 'outgoing side called')(outgoing, 'outgoing')
          server.close()
          proxy.close() 
          running = false
          tests.shift()
          process.nextTick(next)
        })
      })
    })
  })

  function next () {
    var test = tests[0]
    if(test) test()
  }
  if(tests.length === 1)
    next()
}

