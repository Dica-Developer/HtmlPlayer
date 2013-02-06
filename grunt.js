/*global module:true, require:true, process:true*/
module.exports = function (grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    lint:{
      all:['Gruntfile.js', 'js/*.js', 'options/**/*.js']
    }
  });
  grunt.registerTask('test', 'lint');
};