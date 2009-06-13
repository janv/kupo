/** Console Pretty printer */
global.pp = function (x) {
  print(require('test/jsdump').jsDump.parse(x))
}

var serverLoader = require('sandbox').Loader({
  paths      : require.loader.loader.paths,
  extensions : ['','.server.js']
})
require.loader.loaders.push(['.server.js', serverLoader]);
require.loader.loaders.reverse();


exports.testMongoAdapter = require("./mongo_adapter-tests");
exports.testMongoConverter = require("./mongo-converter-tests");
exports.testModel = require("./model-tests");
exports.testAssociations = require("./association-tests");
// exports.testModelInheritance = require("./model-inheritance-tests");

require("os").exit(require("test/runner").run(exports));