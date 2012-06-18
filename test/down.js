var badass = require('..')
var request = require('request')
var tap = require('./tap')
var assert = require('assert')

function rand () {
 return ~~(Math.random()*40000)+1000
}
var _dest, errbackCalled
var proxy = badass.createServer(function (head) {
    return _dest = {port:rand()}
  }, function () {}, function (err, dest) {
    errbackCalled = true
    tap(assert.strictEqual, 'reference to dest is passed')(dest, _dest)
    tap(assert.equal, 'expect ECONREFUSED')(err.code, 'ECONNREFUSED')
  })
var port = rand()
proxy.listen(port, function () {
  request.get('http://localhost:'+port, function (err) {
    //this error will be an econreset, because the connection to the proxy was made, at least.
    tap(assert.equal, 'expect ECONRESET')(err.code, 'ECONNRESET')
    tap(assert.ok, 'errback called')(errbackCalled)
    proxy.close()
    tap.end()
  })
})
