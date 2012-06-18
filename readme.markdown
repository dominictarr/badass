#badass proxy

It's called the badass proxy, because it breaks the rules and doesn't care.

The idea is to implement _just enough_ to make a load-balancer with sicky sessions, that can also handle web-sockets. badass proxy handles WebSockets by not-even-caring about them, and just allows them to fall through.

It's also half-assed, it doesn't even parse http properly.

Just a few regexps to grab the headers. You get a chance to modify the headers, and a chance to decide where to proxy the request, and a chance to modify the headers on the response.

_But only on the first request per TCP connection_, so in http 1.1 multiple requests come on the same connection. In badass proxy the rest of the requests will all go to the same place as the first! This is what you usally want, so thats okay.

If the client and server are well behaved, this should be okay. http isn't ment to send requests to different hosts on the same connection. 

## Example Usage

###Simple Load Balancer

NOTE: `head` (the first arg) is not the same api as a nodejs `ServerRequest` (see below)

``` js
var badass = require('badass')

badass.createServer(function (head) {
  //check head.headers.host
  //return port, host of proxy destination.
  return {port: PORT, host: HOST}
}).listen(80)

```

> note that you must return the proxy dest synchronously. so you need to already know where you are going to send the request - i.e. you must have that data already in memory.

### unix sockets

`dest` may be of the form `{path: PATH_TO_SOCKET}` and badass will proxy
to a server listening on a unix socket at `PATH_TO_SOCKET`

###Sticky Sessions

use a cookie to remember to send additional requests to the same server. Since a browser will first request the html page, then all it's components, if we write the cookie on the first request, the rest should all end up in the same place.

So far I've tested this with websockets and `connect.session` middleware. badass does not create a set-cookie header. It only adds a field to the set-cookie header that the application sets. _so if your application does not set a cookie, it won't get sticky sessions_.

``` js

badass.createStickyServer(function (req, sticky) {
  if(!sticky) //init a random number
    sticky = ~~(Math.random() * 1000000)
  return {port: PORT, host: HOST, sticky: sticky}
}, function (err, dest) {
  //update records that dest.sticky is down.
  //next time, proxy sticky to another server.
  //the user is responsible for managing this information.
  console.error(error, dest)
}).listen(3001)

```

## API

### createServer(lookup, modify?, errback?)

create a basic proxy. function signatures are `lookup (requestHead)`,
`modify(responseHead, dest)`, and `errback (error, dest)`

`lookup` _must_ return a `dest` object of the form `{port: PORT, host: HOST}`. the `dest` object will be passed to `modify` and `errback`.

`modify` is called before writing the response back to the client. it gives you an oppertunity to alter the response head.

`errback` is called when a connection is dropped. `errback` is not called on http errors. badass is ignorant of http errors. 
`errback` will be called with tcp errors, such as `ECONNREFUSED`

### head `//as passed to lookup, and modify`
`head` is NOT the same as a nodejs http request, or response.
example:
```
{ first: 'GET / HTTP1.1'
, headers: {
    'content-type': 'application/json' //etc
  }
}
```
the first line of an http request or response has a different format to the rest of the head. I didn't need it, so I just left it as a string.

`headers` is the rest of the http header, split into lines and `key: value`. badass does not change the case at all.

both `lookup` and `modify` functions may mutate the head object, and that will cause a different head to be written to the proxied stream.

### createStickyServer (lookup, errback)

does most of the work creating a proxy with sticky sessions.
`lookup` is as above, but called with an additional argument.
`lookup (requestHead, sticky)` which is the value of the `sticky` cookie.
`lookup` must also return a `dest` object with an additional property:
`{port: PORT, host: HOST, sticky: STICKY}`.

you should probably set `dest.sticky` to `sticky` unless that server has crashed.

`errback` is as above, but of course `dest` will now also have the `sticky` property. You may want to use the `errback` function so you can detect when a server is down, and proxy future requests to a different instance.
(but that is your responsibility)

### error messages

if `errback` returns a stream it will be piped to the client as an error message.
this must of course be a valid http message with headers, content-length, and CRLF 
line endings. see ./test/error-message.js

## Licence

MIT / Apache2
