/*global $, FileError, console, Audica, PERSISTENT, window, cordova*/
(function (window) {
    'use strict';

    function Filesystem() {
        var backendId = 'filesystem';

        var fileSystem = null;

        var _isCordova = false;

        /**
         *
         * @param {Event} e
         */
        function errorHandler(e) {
            var msg = '';
            switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error: ' + e;
                break;
            }
            Audica.trigger('initReady');
            throw msg;
        }

        /**
         *
         * @param {Number} timestamp
         * @private
         */
        var _searchForSongs = function (timestamp) {
            var reader = fileSystem.root.createReader();
            reader.readEntries(function (results) {
                var songList = [];
                for (var i = 0; i < results.length; i++) {
                    var song = readFile(results[i], timestamp);
                    songList.push(song);
                }
                Audica.trigger('readyCollectingSongs', {
                    songList: songList,
                    backendId: backendId,
                    timestamp: timestamp
                });
            }, function (e) {
                console.error(e);
            });
        };

        /**
         *
         * @param entry
         * @param {Number} timestamp
         * @return {Object|Null}
         */
        function readFile(entry, timestamp) {
            var song = null;
            if (entry.isFile) {
                song = {
                    'artist': 'Unknown',
                    'album': 'Unknown ',
                    'title': entry.name,
                    'id': entry.name,
                    'coverArt': '',
                    'contentType': entry.type,
                    'track': 0,
                    'cd': 0,
                    'duration': 0,
                    'genre': '',
                    'year': 1900,
                    'addedOn': timestamp,
                    'src': entry.toURL(),
                    'backendId': backendId
                };
            } else {
                console.log('Cannot handle "' + entry.name + '".It is a file.');
            }
            return song;
        }

        this.getPlaySrc = function (src) {
            return src;
        };

        this.setCoverArt = function () {};

        function readFileInDirectory(directory, filePath, fileContentCallback, errorCallback) {
            directory.getFile(filePath, {}, function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function (event) {
                        fileContentCallback(event.target.result);
                    };
                    reader.readAsText(file);
                }, errorCallback);
            }, errorCallback);
        }

        this.readFile = function (filePath, fileContentCallback, errorCallback) {
            if (_isCordova) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directory) {
                    readFileInDirectory(directory, filePath, fileContentCallback, errorCallback);
                }, function (error) {
                    Audica.trigger('ERROR', {
                        message: error
                    });
                });
            } else {
                readFileInDirectory(fileSystem.root, filePath, fileContentCallback, errorCallback);
            }
        };

        function writeFileInDirectory(directory, filePath, fileBlob, successCallback) {
            directory.getFile(filePath, {
                create: true
            }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function () {
                        if (typeof successCallback === 'function') {
                            successCallback();
                        }
                        Audica.trigger('INFO', {
                            message: 'Writing file ' + filePath + ' completed.'
                        });
                    };
                    fileWriter.onerror = function (e) {
                        Audica.trigger('ERROR', {
                            message: 'Writing file ' + filePath + ' failed: ' + e
                        });
                    };
                    fileWriter.write(fileBlob);
                }, function (error) {
                    Audica.trigger('ERROR', {
                        message: error
                    });
                });
            }, function (error) {
                Audica.trigger('ERROR', {
                    message: error
                });
            });
        }

        this.writeFile = function (filePath, fileBlob, successCallback) {
            if (_isCordova) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directory) {
                    writeFileInDirectory(directory, filePath, fileBlob, successCallback);
                }, function (error) {
                    Audica.trigger('ERROR', {
                        message: error
                    });
                });
            } else {
                writeFileInDirectory(fileSystem.root, filePath, fileBlob, successCallback);
            }
        };

        /**
         * @param fs
         */
        function onInitFs(fs) {
            fileSystem = fs;
            /*Audica.on('updateSongList', function (args) {
                _searchForSongs(args.timestamp);
            });

            Audica.on('filesImported', function () {
                _searchForSongs($.now());
            });*/
            Audica.trigger('initReady');
            Audica.trigger('fileSystemInitReady');
        }

        this.init = function () {
            if (typeof cordova !== 'undefined') {
                _isCordova = true;
                Audica.trigger('initReady');
            } else {
                if (window.webkitStorageInfo) {
                    window.webkitStorageInfo.requestQuota(PERSISTENT, 1024 * 1024 * 1024, function (grantedBytes) {
                        var requestFileSystem = window.webkitRequestFileSystem || window.requestFileSystem;
                        requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
                    }, function (e) {
                        console.error('Error: ' + e);
                        Audica.trigger('initReady');
                    });
                } else {
                    console.error('No webkitStorage available');
                    Audica.trigger('initReady');
                }
            }
        };
    }

    Audica.extend('fileSystem', new Filesystem());
})(window);
