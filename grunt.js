/*global module:true*/
module.exports = function(grunt) {
"use strict";

  // Project configuration.
  grunt.initConfig({
    globals:{
      vendors: '3rd/**/*.js'
    },
    lint: {
      all: ['grunt.js', 'js/**/*.js', 'options/**/*.js']
    },
    concat: {
      dist:{
        src: [
          '<config:globals.vendors>',
          'js/lib_core.js',
          'js/lib_db.js',
          'js/lib_fileImporter.js',
          'js/lib_fileSystem.js',
          'js/lib_google.js',
          'js/lib_keys.js',
          'js/lib_lastfm.js',
          'js/lib_radioImporter',
          'js/lib_ubuntuone',
          'js/lib_main.js'
        ],
        dest: 'dist/build.js'
      }
    },
    min:{
      dist:{
        src: ['<config:concat.dist.dest>'],
        dest: 'dist/build.min.js'
      }
    },
    jshint: {
      options: {
        browser: true
      }
    }
//    ,
//    copyFiles:{
//      dist:{
//        grunt.file.copy('','');
//      }
//    }
  });
  grunt.registerTask('check', ['lint']);
  grunt.registerTask('test', ['concat']);

  grunt.registerTask('clean', 'Deletes all dist and tmp folder"', function(flag) {
    if('tmp' === flag){
      grunt.log.writeln('Deleting temporary folder');
      //delete tmp folder
    } else if('all' === flag || undefined === flag){
      //delete dist and tmp folder
      grunt.log.writeln('Deleting temporary and distribution folder');
    }
  });
  // Default task.
};