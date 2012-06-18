var badass = require('..')
var request = require('request')
var tap = require('./tap')
var assert = require('assert')
var Stream = require('stream')

function errStream(err) {
  var s = new Stream() 
  process.nextTick(function () {
    s.emit('data', [
      'HTTP/1.1 500 Internal Server Error',
      'Content-Length: ' + err.code.length,
      '',
      err.code
      ].join('\r\n') + '\r\n')
    s.emit('end')
    s.emit('close')
  })
  return s 
}

function rand () {
 return ~~(Math.random()*40000)+1000
}

var _dest, errbackCalled
var proxy = badass.createServer(function (head) {
    return _dest = {port:rand()}
  }, function () {}, 
  function (err, dest) {
    errbackCalled = true
    tap(assert.strictEqual, 'reference to dest is passed')(dest, _dest)
    tap(assert.equal, 'expect ECONREFUSED')(err.code, 'ECONNREFUSED')
    return errStream(err)
  })
var port = rand()

proxy.listen(port, function () {
  request.get('http://localhost:'+port, function (err, res, body) {
    //this error will be an econreset, because the connection to the proxy was made, at least.
    //tap(assert.equal, 'expect ECONRESET')(err.code, 'ECONNRESET')
    tap(assert.equal, 'status 500')(res.statusCode, 500)
    tap(assert.equal, 'body: ECONREFUSED')(body, 'ECONNREFUSED')
    tap(assert.ok, 'errback called')(errbackCalled)
    proxy.close()
    tap.end()
  })
})
