var assert = require("test/assert");
var MongoAdapter  = require("kupo/mongo_adapter").MongoAdapter;
var convert  = require("kupo/mongo_adapter").convert;

var con = new MongoAdapter.Connection('kupo_test');

assert.isJavaClass = function(classname, obj, message) {
  assert.isEqual(classname,String(obj.getClass().getSimpleName()) ,message);
}


exports.testString = function() {
  var s = "Hallo";
  assert.isEqual('string', typeof s);
  assert.isTrue(new String("x") instanceof String);
}

exports.testArray = function() {
  var a = [1, 2];
  var x = convert(a);
  assert.isJavaClass("BasicDBList", x);
  
  a = ["4a2c086b733502e30001c2b5"];
  x = convert(a);
  assert.isJavaClass("BasicDBList", x);
}

exports.testSimpleObject = function() {
  var o = {'a': 1, 'b': 2};
  var x = convert(o);
  assert.isJavaClass("BasicDBObject", x);
}

exports.testNestedObject = function() {
  var o = {'a': 1, 'b': {'x' : 10, 'y' : 20}};
  var x = convert(o);
  assert.isJavaClass("BasicDBObject", x);
  assert.isJavaClass("BasicDBObject", x.get('b'));
  assert.isJavaClass("Double", x.get('b').get('x'));
  assert.isEqual(10, Number(x.get('b').get('x')));
}

exports.testId = function() {
  var o = "4a2c086b733502e30001c2b5";
  var x = convert(o);
  assert.isJavaClass("ObjectId", x);
}

exports.testArrayInObject = function() {
  var o = {'a': 1, 'fk' : {'$in' : ["4a2c086b733502e30001c2b5", "4a2c086b733502e30001c2b6"]}};
  var x = convert(o);
  assert.isJavaClass("BasicDBObject", x);
  assert.isJavaClass("BasicDBObject", x.get('fk'));
  assert.isJavaClass("BasicDBList", x.get('fk').get('$in'));
}

exports.testFindIn = function() {
  var coll = con.getCollection('blubb');
  coll.drop();
  var r = coll.insert([{a:1, fk:"4a2c086b733502e30001c2b5"}, {b:2, fk:"4a2c086b733502e30001c2b6"}]);
  assert.isEqual(2, coll.count());
  r = coll.find({"fk" : {'$in' : ["4a2c086b733502e30001c2b5", "4a2c086b733502e30001c2b6"]}});
  assert.isEqual(2, r.length());
}