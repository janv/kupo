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

exports.Project = Project;