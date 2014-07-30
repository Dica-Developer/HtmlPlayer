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
      all: ['Gruntfile.js', 'js/*.js', 'options/**/*.js']
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
        configFile: '<%= config.test %>/travis.karma.conf.js'
      }
    }
  });

  grunt.registerTask('travis', [
    'jshint',
  ]);
};
