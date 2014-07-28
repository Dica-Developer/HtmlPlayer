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
    concat: {
      libs: {
        src: ['js/lib_core.js'],
        dest: 'test/tmp/libs.js'
      },
      specs: {
        src: ['test/spec/Helper.js', 'test/spec/*Spec.js'],
        dest: 'test/tmp/specs.js'
      }
    },
    uglify: {
      test_specs: {
        src: 'test/tmp/specs.js',
        dest: 'test/tmp/specs.min.js'
      },
      test_libs: {
        src: 'test/tmp/libs.js',
        dest: 'test/tmp/libs.min.js'
      }
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
    'concat:libs',
    'concat:specs',
    'uglify:test_specs',
    'uglify:test_libs'
  ]);
};
