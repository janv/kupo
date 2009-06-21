var Validations = exports.Validations = {
  validatesNumericalityOf : function(prop) {
    return function(){
      if ('number' == typeof this.get(prop) || (this.get(prop) instanceof Number)) {
        return true
      } else {
        this.errors.push([prop, 'is not a number'])
      }
    }
  },

  validatesFormatOf : function(prop, regex) {
    return function(){
      if (typeof this.get(prop).match == 'function' && this.get(prop).match(regex)) {
        return true
      } else {
        this.errors.push([prop, 'does not match' + regex])
      }
    }
  },
  
  validatesPresenceOf : function(prop) {
    return function(){
      if (this.get(prop) === undefined) {
        this.errors.push([prop, 'may not be undefined'])
      } else {
        return true
      }
    }
  }
  
}

