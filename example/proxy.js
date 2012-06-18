
var badass = require('..')
/*
  USAGE
    proxy port proxy1 ...

  port is the port the proxy will listen on, and will round robin to the rest of the list.

*/
var port = + process.argv[2]
var dests = process.argv.slice(3).map(function (e) {
    var m, r
    if(m = /^(\d+)$/.test(e))
      return {port: +e, host: 'localhost'}
    if(m = /^([\w\d-]+):?(port)?$/.exec(e)) 
      return {host: m[1], port: m[2] || 80}
    return {path: e}
  })

console.log('PROXY TO:', dests)

badass.createServer(function () {
  var next = dests.shift()
  console.log('->', next)
  dests.push(next)
  return next
}).listen(port, function () {
  console.log('listening on:', port)
})
