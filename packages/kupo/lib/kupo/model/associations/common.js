CIP = require('kupo/model').CommonInstancePrototype;

var Common = exports.Common = {
  /** Extract Key from a param that is either key or instance  */
  extractKey : function(idOrInstance) {
    if (idOrInstance == null) return null;
    if (idOrInstance.toString().match(/^[abcdef\d]+$/)) return idOrInstance.toString();
    return idOrInstance.id();
  },
  
  isPlainKey : function(idOrInstance) {
    if (idOrInstance == null) return false;
    return idOrInstance.toString().match(/^[abcdef\d]+$/);
  },
  
  isNewInstance : function(i, model) {
    if (!model) model = CIP;
    return (i instanceof model && i.state == 'new' );
  },
  
  isInstance : function(i, model) {
    if (!model) model = CIP;
    return i instanceof model;
  }
}