/** The Common Instance Prototype */
CIP = require('kupo/model').CommonInstancePrototype;

/** Helper functions shared by all associations */
var Common = exports.Common = {
  /** Extract Key from a param that is either key or instance  */
  extractKey : function(idOrInstance) {
    if (idOrInstance == null) return null;
    if (idOrInstance.toString().match(/^[abcdef\d]+$/)) return idOrInstance.toString();
    return idOrInstance.id();
  },

  /** Returns true if argument is a plain key, not an object */
  isPlainKey : function(idOrInstance) {
    if (idOrInstance == null) return false;
    return idOrInstance.toString().match(/^[abcdef\d]+$/);
  },
  
  /**
   * Returns true if the first parameter is a NEW (unsaved) instance of
   * the model given in the second paramter. If no model is provided
   * just checks if the object is an instance of ANY model and for NEW-state.
   */
  isNewInstance : function(i, model) {
    ip = !!model ? model.instancePrototype : CIP;
    return (i instanceof ip && i.state == 'new' );
  },
  
  /**
   * Returns true if the first parameter is an instance of
   * the model given in the second paramter. If no model is provided
   * just checks if the object is an instance of ANY model.
   */
  isInstance : function(i, model) {
    ip = !!model ? model.instancePrototype : CIP;
    return i instanceof ip;
  }
}