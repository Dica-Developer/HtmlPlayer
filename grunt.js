/*global module:true, require:true, process:true*/
module.exports = function(grunt) {
"use strict";

  // Project configuration.
  grunt.initConfig({
    fs: require('fs'),
    path: require('path'),
    vendors: 'app/3rd/**/*.js',
    distFolder: 'dist',
    appFolder: 'app',
    lint: {
      all: ['grunt.js', 'app/js/**/*.js', 'app/options/**/*.js']
    },
    concat: {
      js:{
        src: [
          '<config:vendors>',
          'app/js/lib_core.js',
          'app/js/lib_db.js',
          'app/js/lib_fileImporter.js',
          'app/js/lib_fileSystem.js',
          'app/js/lib_google.js',
          'app/js/lib_keys.js',
          'app/js/lib_lastfm.js',
          'app/js/lib_radioImporter.js',
          'app/js/lib_ubuntuone.js',
          'app/js/lib_main.js'
        ],
        dest: 'dist/js/build.js'
      },
      css:{
        src: [
          'app/options/css/browser.css',
          'app/options/css/button.css',
          'app/options/css/checkbox.css',
          'app/options/css/chrome_shared.css',
          'app/options/css/select.css',
          'app/options/css/style.css'
        ],
        dest: 'dist/options/css/style.css'
      },
      optionsJS:{
        src: [
          'app/3rd/md5.js',
          'app/3rd/jquery.min.js',
          'app/js/lib_lastfm.js',
          'app/js/lib_fileImporter.js',
          'app/options/js/main.js'
        ],
        dest: 'dist/options/js/main.js'
      }
    },
    min:{
      js:{
        src: ['<config:concat.js.dest>'],
        dest: 'dist/js/build.min.js'
      },
      optionsJS:{
        src: ['<config:concat.optionsJS.dest>'],
        dest: 'dist/options/js/main.min.js'
      }
    },
    jshint: {
      options: {
        browser: true
      }
    },
    clean:{
      all: ['tmp','dist'],
      tmp: ['tmp']
    }
  });

  grunt.registerTask('test', function test(){
    grunt.helper('writeMainHTML');
  });

  grunt.registerTask('build', 'Build distribution folder with concatenated and minimized files!', function(){
    var srcFolder = grunt.config.get('appFolder');
    var destFolder = grunt.config.get('distFolder');
    grunt.helper('cpAllFiles', srcFolder, destFolder);

    grunt.task.run(['lint:all','concat','min']);

    grunt.helper('writeManifest');
    grunt.helper('rewriteHTML');
  });

  grunt.registerMultiTask('clean', 'Removes tmp/dist folder', function clean(){
    var data = this.data,
      length = data.length,
      i = 0;
    for (i; i < length; i++) {
      var folder = data[i];
      grunt.helper('rmFolder', folder);
    }
  });

  grunt.registerHelper('rmFolder', function rmFolder(folder) {
    var fs = grunt.config.get(['fs']),
      path = grunt.config.get(['path']),
      lstatSync = process.platform === "win32" ? "statSync" : "lstatSync",
      resolvedPath = path.resolve(folder),
      tmp;

    try {
      tmp = fs[lstatSync](resolvedPath);
    } catch (er) {
      if (er.code === "ENOENT") { return true; }
      throw er;
    }

    if(!tmp.isDirectory()) { return fs.unlinkSync(resolvedPath); }

    fs.readdirSync(resolvedPath).forEach(function (f) {
      grunt.helper('rmFolder', path.join(resolvedPath, f));
    });

    fs.rmdirSync(resolvedPath);
    grunt.log.writeln('Folder "' + resolvedPath + '" successfully removed.');
  });

  grunt.registerHelper('cpAllFiles', function cpAllFiles(src, dest) {
    var fs = grunt.config.get(['fs']),
      path = grunt.config.get(['path']),
      lstatSync = process.platform === "win32" ? "statSync" : "lstatSync",
      resolvedPath = path.resolve(src),
      excludePaths = new RegExp(/^\.|^test|^3rd|^js/),
      s;

    s = fs[lstatSync](resolvedPath);
    if(s.isDirectory()){
      fs.readdirSync(resolvedPath).forEach(function (folderName) {
        if(!(excludePaths).test(folderName)){
          var entry = fs[lstatSync](path.join(resolvedPath, folderName));
          var appFolder = grunt.config.get('appFolder');
          if(entry.isDirectory()){
            grunt.helper('cpAllFiles', path.join(resolvedPath, folderName), dest);
          }else{
            grunt.log.writeln('Copy from: "' + resolvedPath + '/' + folderName+
              '" to: "' + resolvedPath.replace(appFolder,dest) + '/' + folderName+'"');
            grunt.file.copy(resolvedPath + '/' + folderName, resolvedPath.replace(appFolder,dest) + '/' + folderName);
          }
        }
      });
    }
  });

  grunt.registerHelper('writeManifest', function writeManifest(){
    var manifest = grunt.file.readJSON('app/manifest.json');
    for(var x in manifest){
      if (manifest.hasOwnProperty(x)) {
        if(x === 'name'){
          manifest[x] = manifest[x].replace('[DEV]','');
        }
      }
    }

    grunt.file.write('dist/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerHelper('rewriteHTML', function rewriteHTML(){
    var mainHTML = grunt.file.read('app/main.html');
    var newSrc = '<script type="text/javascript" src="js/build.min.js"></script>';

    var startPosition = mainHTML.indexOf('<!--start replace-->');
    var endPosition = mainHTML.indexOf('<!--end replace-->') + '<!--end replace-->'.length;

    var firstPart = mainHTML.substr(0, startPosition);
    var lastPart = mainHTML.substr(endPosition);

    var newMain = firstPart + newSrc + lastPart;
    grunt.file.write('dist/main.html', newMain);


    var indexHTML = grunt.file.read('app/options/index.html');
    var newIndexSrc = '<script type="text/javascript" src="js/main.min.js"></script>';

    var startIndexPosition = indexHTML.indexOf('<!--start replace-->');
    var endIndexPosition = indexHTML.indexOf('<!--end replace-->') + '<!--end replace-->'.length;

    var firstIndexPart = indexHTML.substr(0, startIndexPosition);
    var lastIndexPart = indexHTML.substr(endIndexPosition);

    var newIndex = firstIndexPart + newIndexSrc + lastIndexPart;
    grunt.file.write('dist/options/index.html', newIndex);
  });

};