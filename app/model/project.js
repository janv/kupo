var Model = require('kupo/model').Model;
var Project = Model.define('project',{
  instance: {
    
  },
  callables: ['blubb'],
  callbacks: {
    beforeProcess: function(){
      print('PROJECT beforeProcess callback executing')
    },
    afterProcess: function(){
      print('PROJECT afterProcess callback executing')
    }
  }
});

Project.blubb = function(x) {
  return "This is the result of the blubb test-function which multiplies the argument by 3: " + ( 3 * x ).toString()
}

exports.Project = Project;