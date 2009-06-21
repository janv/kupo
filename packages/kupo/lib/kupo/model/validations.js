var Validations = exports.Validations = {
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

