/*global module:true, require:true, process:true*/
module.exports = function (grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    lint:{
      all:['Gruntfile.js', 'js/*.js', 'options/**/*.js']
    },
    min: {
      test_specs:{
        src: ['test/spec/*.js'],
        dest: 'test/tmp/specs.js'
      },
      test_libs:{
        src: ['js/*.js'],
        dest: 'test/tmp/libs.js'
      }
    },
    clean:{
      tmp: 'test/tmp'
    }
  });

  grunt.loadNpmTasks('grunt-contrib');

  grunt.registerTask('travis', 'Runs tests',function(){
    grunt.task.run('lint');
    grunt.task.run('min:test_specs');
    grunt.task.run(['min:test_libs']);
  });

//  grunt.registerTask('test-local', 'Runs tests',function(){
//    grunt.task.run('lint');
//    grunt.task.run('min:travis_specs');
//    grunt.task.run('min:travis_libs');
//  });
};