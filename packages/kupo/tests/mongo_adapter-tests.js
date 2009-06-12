var assert = require("test/assert");
var MongoAdapter  = require("kupo/mongo_adapter").MongoAdapter;

var con = new MongoAdapter.Connection('kupo_test');

exports.testEstablishConnection = function() {
  assert.isTrue(con != undefined);
  assert.isTrue(con.mongo instanceof Packages.com.mongodb.Mongo);
}

exports.testGetCollection = function() {
  var coll = con.getCollection('project');
  assert.isTrue(coll.mongoCollection instanceof Packages.com.mongodb.DBCollection);
}


exports.testCollection = {
  
  setup : function() {
    this.coll = con.getCollection('project');
    this.coll.drop();    
  },
  
  testDrop : function() {
    this.coll.insert({a:1});
    assert.isEqual(1, this.coll.count());
    this.coll.drop();
    assert.isEqual(0, this.coll.count());
  },

  testCount : function() {
    this.coll.insert({a:1});
    assert.isEqual(1, this.coll.count());
    this.coll.insert({b:2});
    this.coll.insert({c:3});
    assert.isEqual(3, this.coll.count());
  },

  testInsertOnlyObjects : function() {
    assert.throwsError(function(){this.coll.insert(1)});
    assert.throwsError(function(){this.coll.insert(null)});
    assert.throwsError(function(){this.coll.insert("assa")});
                       function(){this.coll.insert({})};
  },

  testUpdateOnlyObjects : function() {
    this.coll.insert({a:1});
    assert.throwsError(function(){this.coll.update({a:1}, 1)});
    assert.throwsError(function(){this.coll.update({a:1}, null)});
    assert.throwsError(function(){this.coll.update({a:1}, "assa")});
                       function(){this.coll.update({a:1}, {})};

    assert.throwsError(function(){this.coll.update(1, {})});
  },
  
  testInsertArray : function() {
    var r = this.coll.insert([{a:1}, {b:2}]);
    assert.isEqual(2, this.coll.count());
    assert.isEqual(2, r.length);
    assert.isEqual(1, r[0]['a']);
    assert.isEqual(2, r[1]['b']);
  },
  
  testInsertArraySimple : function() {
    var r = this.coll.insert({a:1}, {b:2});
    assert.isEqual(2, this.coll.count());
    assert.isEqual(2, r.length);
    assert.isEqual(1, r[0]['a']);
    assert.isEqual(2, r[1]['b']);
  },
  
  testUpdate : function() {
    var x = this.coll.insert({a:1});
    var y = this.coll.update({_id: x._id}, {b:2});
    assert.isEqual(1, this.coll.count());
    assert.isEqual(1, x.a);
    assert.isEqual(2, y.b);
  },

  testUpsert : function() {
    this.coll.update({_id: new Packages.com.mongodb.ObjectId()}, {b:2}, true);
    assert.isEqual(1, this.coll.count());
    var x = this.coll.findOne({});
    assert.isEqual(2, x.b);
  },

  testRemove : function() {
    var a = this.coll.insert({a:1});
    assert.isEqual(1, this.coll.count());
    this.coll.remove({"_id" : a['_id']});
    assert.isEqual(0, this.coll.count());
  },
  
  testIdConversion : function() {
    var r = this.coll.insert({a:1});
    var id = "" + r._id;
    assert.isEqual(1, this.coll.findOne({_id : id}).a);
    assert.isEqual(1, this.coll.findId(id).a);
  },
  
  testFind : {
    setup : function() {
      this.coll = con.getCollection('project');
      this.coll.drop();
      this.coll.insert([{a:1, x:1}, {a:1, x:2}, {a:2}, {a:3}, {b:2}, {c:3}]);
    },
    
    testFindOne : function() {
      var r = this.coll.findOne({a:1})
      assert.isEqual(1,r.a);
      r = this.coll.findOne({b:1})
      assert.isEqual(null,r);
    },
    
    testFindId : function() {
      var x = this.coll.insert({bla:"blubb"});
      var y = this.coll.findId(x._id);
      assert.isEqual("blubb", x.bla);
      assert.throwsError(function(){
        this.coll.findId("123");
      })
    },
    
    testfind : function() {
      var c = this.coll.find({a:1});
      assert.isEqual(2, c.length());
    }
  }
}

exports.testCursor = {
  setup : function() {
    this.coll = con.getCollection('project');
    this.coll.drop();
    this.coll.insert([{a:1, x:1}, {a:1, x:2}, {a:2}, {a:3}, {b:2}, {c:3}]);
  },
  
  testFindEmpty : function() {
    var c = this.coll.find({a:5});
    assert.isTrue(!c.hasNext());
    c = this.coll.find({a:5});
    assert.isEqual(0, c.length());
  },
  
  testLength : function() {
    var c = this.coll.find({a:1});
    assert.isEqual(2, c.length());
    c = this.coll.find({});
    assert.isEqual(6, c.length());
  },
  
  testToArray : function() {
    var c = this.coll.find({a:1}).toArray();
    assert.isTrue(c instanceof Array);
    assert.isEqual(2, c.length);
  },
  
  testMap : function() {
    var c = this.coll.find({a:1}).map(function(o){
      return o.x * 2;
    });
    assert.isEqual(2, c[0]);
    assert.isEqual(4, c[1]);
  }
  
}

