var net = require('net')
var port = process.argv[3]
var stream = net.connect(port || 3001)
stream.write('GET / HTTP/1.1\r\n')
/*
if we write two blank lines, that is the end of the 
header... so the proxy will make a connection to the server.
if not, it will not make a connection.
*/
//stream.write('\r\n\r\n')

setTimeout(function () {
  process.exit()
}, 100)
stream.on('close', function () {
  console.log('close')
})
