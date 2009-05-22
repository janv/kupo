var Errors = require('kupo/errors').Errors;
var JSON   = require('json')

var Mongo         = Packages.com.mongodb.Mongo;
var BasicDBObject = Packages.com.mongodb.BasicDBObject;
var BasicDBList   = Packages.com.mongodb.BasicDBList;


var MongoAdapter = exports.MongoAdapter = {};

//Connection
MongoAdapter.Connection = function(_database) {
  this.mongo = new Mongo(_database);
}
MongoAdapter.Connection.prototype = {
  getCollection : function(_collection) {
    return new Collection(this.mongo.getCollection(_collection));
  }
}

var conn = new MongoAdapter.Connection("kupo") //TODO: global konfigurieren und speichern
MongoAdapter.getConnection = function(){
  return conn;
}



var Collection = function(_mongoCollection) {
  this.mongoCollection = _mongoCollection
}
Collection.prototype = {
  insert : function(o) {
    if (!(o instanceof Array)) o = [o]
    for (var i=0; i < o.length; i++) {
      this.mongoCollection.insert(createDoc(o[i]))
    };
  },
  
  update : function(finder, object, upsert, apply) {
    this.mongoCollection.update(createDoc(finder), createDoc(object), upsert, apply)
  },
  
  remove : function(o) {
    this.mongoCollection.remove(createDoc(o))
  },
  
  //returns iterator over DBObjects
  query : function(query, fields, toSkip, toReturn) {
    // abstract Iterator<DBObject> find( DBObject ref , DBObject fields , int numToSkip , int numToReturn ) throws MongoException ;
    var it = this.mongoCollection.find(createDoc(query), createDoc(fields), toSkip, toReturn)
    return new Cursor(it);
  },
  
  //returns DBCursor
  find : function(ref) {
    if (ref === null) {
      var cursor = this.mongoCollection.find();
      return new Cursor(cursor);
    } else {
      var cursor =  this.mongoCollection.find(createDoc(ref));
      return new Cursor(cursor);
    }    
  },
  
  ensureIndex  : function() {
    throw new Errors.InternalError("MongoCollection.ensureIndex isn't implemented yet");
    // public abstract void ensureIndex( DBObject keys , String name , boolean unique ) throws MongoException ;
    // public abstract void ensureIndex( DBObject keys , String name ) throws MongoException ;
    // public final void ensureIndex( final DBObject keys )
    // public final void ensureIndex( final DBObject keys , final boolean force )
    // public final void ensureIndex( final DBObject keys , final boolean force , final boolean unique )
  },
  
  findOne : function(o) {
    return fromDoc(this.mongoCollection.findOne(createDoc(o)))
  },

  findId : function(id) {
    return this.findOne({"_id" : id})
  },

  save : function(o) {
    return fromDoc(this.mongoCollection.save(createDoc(o)))    
  },

  count : function(query) {
    if (query === null) {
      return this.mongoCollection.getCount();
    } else {
      return this.mongoCollection.getCount(createDoc(query));
    }
  }
}

var Cursor = function(_mongoCursor) {
  this.mongoCursor = _mongoCursor;
}
Cursor.prototype = {
  hasNext : function() {
    return this.mongoCursor.hasNext();
  },
  
  next    : function() {
    return fromDoc(this.mongoCursor.next());
  },
  
  curr    : function() {
    return fromDoc(this.mongoCursor.curr());
  },
  
  length  : function() {
    return this.mongoCursor.length();
  },
  
  count   : function() {
    return this.mongoCursor.count();
  },
  
  toArray : function() {
    var a = this.mongoCursor.toArray().toArray();
    var b = [];
    for (var i=0; i < a.length(); i++) {
      b.push(fromDoc(a[i]))
    };
    return b;
  }
}

/*** createDoc
    Creates a BasicDBObject Document for the Mongo Java Adapter to store
 */
var createDoc = function(obj) {
  if (typeof obj == 'object' && obj instanceof Object) {
    return convert(obj);
  } else {
	  throw new Errors.InternalError("Only objects can be be serialized into BSON objects");
  }
}

// Does the actual work behind createDoc
var convert =  function(obj) {
  switch (typeof(obj)) {
    case "string":
      return obj; //Rhino konvertiert implizit in Java String
    case "number":
      return new java.lang.Double(obj)
    case "boolean":
      return new java.lang.Boolean(obj)
  	case "function":
  	  throw new Errors.InternalError("Functions can not be serialized into BSON objects");
    case "object":
  		if (obj === null) {
  		  return null;
  		} else if (obj instanceof Number)  { 
        return new java.lang.Double(obj);
  		} else if (obj instanceof Boolean)  { 
        return new java.lang.Boolean(obj);
  		} else if (obj instanceof RegExp)  { 
    	  throw new Errors.InternalError("Regular expressions can not be serialized into BSON objects");
  		} else if (obj instanceof String) { 
        return obj;
  		} else if (obj instanceof Date) { 
  		  return java.util.Date(obj)
  		} else if (obj instanceof Array) {
  		  var arr = new BasicDBList();
  		  for (var i=0; i < obj.length; i++) {
  		    arr.put(i, arguments.callee(obj[i]));
  		  };
  		  return arr;
  		} else if (obj instanceof Object) {
  		    var o = new BasicDBObject();
  		    for (var p in obj) {
  		      o.put(p, arguments.callee(obj[p]));
  		    }
  		    return o;
  		}
    	break;
  }
  return null;
}

/*** fromDoc
    Convert a MongoDB document to Javascript
*/
var fromDoc = function(doc) {
  return JSON.parse(String(doc.toString()))
}