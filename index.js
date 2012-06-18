var net = require('net')
var es  = require('event-stream')
var Stream = require('stream').Stream

exports.createServer = function (lookup, modify, errback) {
  return net.createServer(exports.handler(lookup, modify, errback))
}

exports.createStickyServer = function (lookup, errback) {
  return net.createServer(exports.handler(function (req) {
    var cookie, sticky, m
    if(cookie = req.headers.Cookie) {
      if(m = /sticky=([\w\d]+)[;$]/.exec(cookie))
       sticky = m[1]
    }
    return lookup(req, sticky)
  }, function (res, dest) {
    var setCookie
    if(setCookie = res.headers['Set-Cookie']) {
      if(!/sticky=[\w\d]+[;$]/.test(setCookie))
       res.headers['Set-Cookie'] = 'sticky='+dest.sticky+'; ' + setCookie
    }
  }, errback))
}

/*
  a sync through stream that matches and replaces only ONCE
  before a pattern.
  the intension is to match the empty line that marks the
  end of the first header.
*/

var replace = 
exports.replace = function (match, replace) {
  var soFar = ''
  var matched = false
  return es.through(function (data) {
    if(!matched) {
      soFar += data
      matched = match.exec(soFar)
      if(matched) {
        this.emit('data', replace(soFar.substring(0, matched.index)))
        this.emit('data', soFar.substring(matched.index))
      }
    } else
      this.emit('data', data)
  }, function () {
    if(!matched && soFar)
      this.emit('data', soFar)
    this.emit('end')
  })
}

var parse = 
exports.parse = function (header) {
  var lines = header.split('\r\n')
    , first = lines.shift(), headers = {}
  lines.forEach(function (l) {
    var i = l.indexOf(':')
    headers[l.substring(0, i).trim()] = l.substring(i + 1).trim()
  })
  return {first: first, headers: headers}
}

var stringify = exports.stringify = function (header) {
  var r = [header.first]
  for(var h in header.headers) 
    r.push(h + ': ' + header.headers[h])
  return r.join('\r\n')
}

exports.handler = function (lookup, modify, errback) {
  return function (con) {
    var first
    con.pipe(first = replace(/\r\n\r\n/, function (header) {
      var req, dest = lookup(req = parse(header))
      var outs = 
        first.pipe(
          (dest.path ? net.connect(dest.path) : net.connect(dest.port, dest.host))
          .on('error', function (err) { //will this be gc'd?
            /*
              this only gets called if there is a ECONNREFUSED
              i.e. if there is no server where we've tried to proxy.
              if the server or the client close/crash, it will not produce an error 
              but will appear to close normally.

              so: errback means that the server is down. 
            */
            var maybe
            if(errback) maybe = errback(err, dest)
            else console.error('server down', err, dest)
            //it would actually be possible to write a propper error response here
            //if errback returns a stream then 
            if(maybe instanceof Stream)
              maybe.pipe(con)
            else
              con.destroy()
          })
        )
      if(modify)
        outs = outs.pipe(replace(/\r\n\r\n/, function (header) {
          var res = parse(header)
          modify(res, dest)
          return stringify(res)
        }))

        outs
          .pipe(process.stderr, {end: false})
        
        outs  .pipe(con)
        return stringify(req)
    }))
  }
}
