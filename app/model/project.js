var Model = require('model').Model;
var Project = Model.define('project',{
  instance: {
    
  },
  callbacks: {
    beforeProcess: function(){
      print('PROJECT beforeProcess callback executing')
    },
    afterProcess: function(){
      print('PROJECT afterProcess callback executing')
    }
  }
});

Project.blubb = function() {
  return "This is the miserable little result of the blubb-test function"
}

exports.Project = Project;