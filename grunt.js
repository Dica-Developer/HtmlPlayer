/*global module:true, require:true, process:true*/
module.exports = function (grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    lint:{
      all:['Gruntfile.js', 'js/*.js', 'options/**/*.js']
    },
    concat:{
      libs:{
        src: ['js/lib_*.js'],
        dest: 'test/tmp/libs.js'
      },
      specs:{
        src: ['test/spec/Helper.js','test/spec/*Spec.js'],
        dest: 'test/tmp/specs.js'
      }
    },
    min: {
      test_specs:{
        src: '<config:concat.specs.dest>',
        dest: 'test/tmp/specs.min.js'
      },
      test_libs:{
        src: '<config:concat.libs.dest>',
        dest: 'test/tmp/libs.min.js'
      }
    },
    clean:{
      tmp: 'test/tmp'
    }
  });

  grunt.loadNpmTasks('grunt-contrib');

  grunt.registerTask('travis', 'Runs tests',function(){
    grunt.task.run('lint');
    grunt.task.run('concat:libs');
    grunt.task.run('concat:specs');
    grunt.task.run('min:test_specs');
    grunt.task.run(['min:test_libs']);
  });

//  grunt.registerTask('test-local', 'Runs tests',function(){
//    grunt.task.run('lint');
//    grunt.task.run('min:travis_specs');
//    grunt.task.run('min:travis_libs');
//  });
};