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
    ip = !!model ? model.instancePrototype : CIP;
    return (i instanceof ip && i.state == 'new' );
  },
  
  isInstance : function(i, model) {
    ip = !!model ? model.instancePrototype : CIP;
    return i instanceof ip;
  }
}