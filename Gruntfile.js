/*global module:true, require:true, process:true*/
module.exports = function (grunt) {
  "use strict";

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  // Project configuration.
  grunt.initConfig({
    jshint:{
      all:['Gruntfile.js', 'js/*.js', 'options/**/*.js']
    },
    concat:{
      libs:{
        src: ['js/lib_core.js'],
        dest: 'test/tmp/libs.js'
      },
      specs:{
        src: ['test/spec/Helper.js','test/spec/*Spec.js'],
        dest: 'test/tmp/specs.js'
      }
    },
    uglify: {
      test_specs:{
        src: 'test/tmp/specs.js',
        dest: 'test/tmp/specs.min.js'
      },
      test_libs:{
        src: 'test/tmp/libs.js',
        dest: 'test/tmp/libs.min.js'
      }
    },
    less: {
      dev: {
        options: {
          paths: ["./"]
        },
        files: {
          "style.css": "style.less"
        }
      },
      dist: {
        options: {
          paths: ["./"],
          yuicompress: true
        },
        files: {
          "style.css": "style.less"
        }
      }
    },
    clean:{
      tmp: 'test/tmp'
    }
  });

  grunt.loadNpmTasks('grunt-contrib');

  grunt.registerTask('travis', 'Runs tests',function(){
    grunt.task.run('jshint');
    grunt.task.run('concat:libs');
    grunt.task.run('concat:specs');
    grunt.task.run('uglify:test_specs');
    grunt.task.run(['uglify:test_libs']);
  });

//  grunt.registerTask('test-local', 'Runs tests',function(){
//    grunt.task.run('lint');
//    grunt.task.run('min:travis_specs');
//    grunt.task.run('min:travis_libs');
//  });
};