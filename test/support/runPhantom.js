var system = require('system')

try {
  for (var i=1; i<system.args.length; i++) {
    var scriptFileName = system.args[i]
    require(scriptFileName)
  }
}
catch(error) {
  console.log(error)
  console.log(error.stack)
}
finally {
  phantom.exit()
}
