/** A number of predefined validaton generators */
var Validations = exports.Validations = {
  /** Verifies that the named property is a Number */
  validatesNumericalityOf : function(prop) {
    return function(){
      if (this.get(prop) && (('number' == typeof this.get(prop)) || (this.get(prop) instanceof Number))) {
        return true;
      } else {
        this.errors.push([prop, 'is not a number']);
        return false;
      }
    }
  },

  /** Verifies that the named property matches a regular expression */
  validatesFormatOf : function(prop, regex) {
    return function(){
      if (this.get(prop) && this.get(prop).match && this.get(prop).match(regex)) {
        return true;
      } else {
        this.errors.push([prop, 'does not match' + regex]);
        return false;
      }
    }
  },
  
  /** Verifies that the named property exists */
  validatesPresenceOf : function(prop) {
    return function(){
      if (this.get(prop) === undefined) {
        this.errors.push([prop, 'may not be undefined']);
        return false;
      } else {
        return true;
      }
    }
  },
  
  /** Verifies that the named property exists and is a non-empty String */
  validatesNonBlank : function(prop) {
    return function(){
      if (this.get(prop) && this.get(prop).match && this.get(prop).match(/[^\s+]/)) {
        return true;
      } else {
        this.errors.push([prop, "can\'t be blank"]);
        return false;
      }
    }
  },
  
  /** Verifies that the named property has the format of an ID */
  validatesId : function(prop) {
    return function(){
      if (this.get(prop) && this.get(prop).match && this.get(prop).match(/^[0-9a-f]{24}$/i)) {
        return true
      } else {
        this.errors.push([prop, "is not a valid id"])
      }
    }
  },
  
  
}

