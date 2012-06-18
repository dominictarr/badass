
var port = process.argv[3] || 3000
require('http').createServer(function (req, res) {
  console.log('REQUEST')
  var i = setInterval(function () {
    res.write(new Date().toString() + '\n')
  }, 1e3)
  req.on('close', function () {
    clearInterval(i)
    console.log('CLOSE')
  })
}).listen(port, function () {
  console.log('echo server listening on:', port)
})
