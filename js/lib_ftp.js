/*global Audica:true, XMLHttpRequest:true, console:true, window, chrome*/
(function (window, Audica) {
    'use strict';

    if (!String.prototype.startsWith) {
        Object.defineProperty(String.prototype, 'startsWith', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function (searchString, position) {
                position = position || 0;
                return this.lastIndexOf(searchString, position) === position;
            }
        });
    }

    function FTP() {
        var _login, _password, _serverUrl, _ftpClient, _rootFolder, _list = {};


        function recursiveWalk(rootObject, folderName, resolve){
            console.log(rootObject, folderName, resolve);
            if (typeof resolve !== 'undefined'){
                _ftpClient.list(folderName)
                    .then(function(files){
                        var hasDir = false;
                        files.forEach(function(file){
                            var fileName = file.name.trim();
                            if(!file.isDirectory && fileName !== ''){
                                rootObject[fileName] = file;
                            } else if (file.isDirectory && !fileName.startsWith('.') && fileName !== ''){
                                hasDir = true;
                                rootObject[fileName] = {};
                                var newRootFolder = folderName + '/' + fileName;
                                recursiveWalk(rootObject[fileName], newRootFolder, resolve);
                            }
                        });

                        if(!hasDir){
                            resolve();
                        }
                    });
            } else {
                var promise = function(resolve){
                    _ftpClient.list(folderName)
                        .then(function(files){
                            var hasDir = false;
                            files.forEach(function(file){
                                var fileName = file.name.trim();
                                if(!file.isDirectory && fileName !== ''){
                                    rootObject[fileName] = file;
                                } else if (file.isDirectory && !fileName.startsWith('.') && fileName !== ''){
                                    hasDir = true;
                                    rootObject[fileName] = {};
                                    var newRootFolder = folderName + '/' + fileName;
                                    console.log(newRootFolder.indexOf('\r'));
                                    recursiveWalk(rootObject[fileName], newRootFolder, resolve);
                                }
                            });

                            if(!hasDir){
                                resolve();
                            }
                        });
                };
                return new Promise(promise);
            }
        }

        function walkTheTree(rootFolder) {
            window.rootFolder = rootFolder;
            var promises = [];
            var folderName = rootFolder[9];
            _list[folderName] = {};
            promises.push(recursiveWalk(_list[folderName], folderName));
//            rootFolder.forEach(function(folderName){
//                if(folderName !== '') {
//                    _list[folderName] = {};
//                    promises.push(recursiveWalk(_list[folderName], folderName));
//                }
//            });

            Promise.all(promises)
                .then(function(){
                    console.log(_list);
                });
        }

        function getRoot() {
            _ftpClient.listDir()
                .then(walkTheTree);
        }

        this.getPlaySrc = function (src) {
            return src;
        };

        this.setCoverArt = function (src, coverArt) {
            coverArt.attr('src', src);
        };

        this.retrieveList = function () {
            if (_ftpClient.isConnected) {
                _ftpClient.connect()
                    .then(getRoot)
            } else {
                getRoot();
            }
        };


        Audica.on('updateSongList', function () {
            console.log('updateSongList');
            this.retrieveList();
        }.bind(this));

        this.init = function () {
            console.log('FTP');
            chrome.storage.local.get(['ftp_login', 'ftp_pass', 'ftp_url'], function (items) {
                var password = items.ftp_pass;
                var serverUrl = items.ftp_url;
                var login = items.ftp_login;
                if (login) {
                    _login = JSON.parse(login);
                }
                if (password) {
                    _password = JSON.parse(password);
                }
                if (serverUrl) {
                    _serverUrl = JSON.parse(serverUrl);
                }

                _rootFolder = 'Music';

                _ftpClient = new FtpClient(_serverUrl, 21, _login, _password);
                _ftpClient.connect().then(function () {
                    Audica.trigger('initReady');
                });
            });
        };
    }

    Audica.extend('ftp', new FTP());
}(window, Audica));
