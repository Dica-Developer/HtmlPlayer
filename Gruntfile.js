/*global module:true, require:true*/
module.exports = function(grunt) {
  'use strict';

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  // Project configuration.
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['app/js/components/**/*.js']
    },
    less: {
      dev: {
        files: {
          "app/style/style.css": "app/style/style.less"
        }
      }
    },
    clean: {
      tmp: 'test/tmp'
    },
    karma: {
      dev: {
        configFile: 'test/karma.conf.js'
      },
      travis: {
        configFile: 'test/travis.karma.conf.js'
      }
    }
  });

  grunt.registerTask('travis', [
    'jshint',
    'karma:travis'
  ]);
};
