require('packages').load('..')

// Prepare debug helpers
var Util = require('../../v8cgi/util').Util
/** Console Pretty printer */
global.pp = function (x) {
  print(Util.serialize(x, true))
}

exports.testModel = require("./mongo_adapter-tests");

require("os").exit(require("test/runner").run(exports));