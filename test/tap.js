var tests = 0, failure = 0, from = 1

function tap(assert, message) {
  if('function' !== typeof assert)
    tap.test(assert, message)
  return function () {
    var args = [].slice.call(arguments)
    try {
      assert.apply(null, arguments)
      tap.ok(true, message)
    } catch (err) { 
      tap.ok(false, message)
      throw err
    }
  }
}

tap.ok = function (bool, message) { 
  if(!bool) failure ++
  console.log([bool ? 'ok' : 'not ok', ++tests, '--', message].join(' '))
}

tap.plan = function (n) {
  console.log(from+'..'+n)
  from += n
}

tap.end = function () {
  console.log(from + '..' + tests)
  from = tests + 1
}

module.exports = tap
