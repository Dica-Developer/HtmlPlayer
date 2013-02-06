/*global module:true, require:true, process:true*/
module.exports = function (grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    jasmine_node:{
      specNameMatcher:"./test/example/spec/*.js",
      projectRoot:".",
      requirejs:false,
      forceExit:true,
      jUnit:{
        report:false,
        savePath:"./build/reports/jasmine/",
        useDotNotation:true,
        consolidate:true
      }
    },
    lint:{
      all:['Gruntfile.js', 'js/*.js', 'options/**/*.js']
    }
  });


  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('test', 'lint jasmine_node');

};