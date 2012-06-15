var http = require('http')
var request = require('request')
var badass = require('..')
var assert = require('assert')
function rand () {
  return ~~(1000 + Math.random()*40000)
}

var sPort = rand()
var pPort = rand()

var server = http.createServer(function (req, res) {
  console.log('REQ', 'hello')
  res.end('hello')
})
var incoming, outgoing, _dest
var proxy = badass.createServer(function lookup (req) {
  incoming = true
  console.log('REQ', req)
  return _dest = {port: sPort, host: 'localhost', rand: Math.random()}
}, function modify (res, dest) {
  //optionally modify the response 
  //header before sending back
  //to client. for example, 
  //add a cookie for sticky sessions.
  outgoing = true
  assert.strictEqual(dest, _dest)
  console.log("RES", res, dest)
})

server.listen(sPort, function () {
  proxy.listen(pPort, function () {
    request.get('http://localhost:'+pPort, 
      function (err, res, body) {
        assert.equal(body, 'hello')
        assert.ok(incoming, 'incoming')
        assert.ok(outgoing, 'outgoing')
        server.close()
        proxy.close()
        console.log('passed')
    })
  })
})

