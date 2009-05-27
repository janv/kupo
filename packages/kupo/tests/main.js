require('packages').load('..')

// Prepare debug helpers
var Util = require('../../v8cgi/util').Util
/** Console Pretty printer */
global.pp = function (x) {
  print(Util.serialize(x, true))
}

exports.testMongoAdapter = require("./mongo_adapter-tests");
exports.testModel = require("./model-tests");

require("os").exit(require("test/runner").run(exports));