/** Console Pretty printer */
global.pp = function (x) {
  print(require('test/jsdump').jsDump.parse(x))
}

exports.testMongoAdapter = require("./mongo_adapter-tests");
exports.testMongoConverter = require("./mongo-converter-tests");
exports.testModel = require("./model-tests");
exports.testAssociations = require("./association-tests");

require("os").exit(require("test/runner").run(exports));