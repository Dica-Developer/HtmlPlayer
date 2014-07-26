/*
 Massive inspired and copied from:
 https://github.com/MikeCostello/chrome-app-ftp
 */
/*global Promise, TcpClient*/
(function (root) {
    'use strict';

    function FtpClient(host, port, user, password) {
        this.host = host;
        this.port = port;
        this.username = user;
        this.password = password;
        this.isConnected = false;
        this.features = {};

        log('initialized ftp client');
    }

    FtpClient.prototype.connect = function () {
        this.controlSocket = new TcpClient(this.host, this.port);
        return new Promise(function (resolve) {
            this.controlSocket.connect(function () {
                this._user(this.username)
                    .then(this._pass.bind(this, this.password))
                    .then(this._feat.bind(this))
                    .then(this._type.bind(this, 'I'))
                    .then(function () {
                        this.isConnected = true;
                        this.keepAlive = setInterval(this._noop.bind(this), 500000); // 500s
                        resolve(this);
                    }.bind(this));
            }.bind(this));
        }.bind(this));
    };

    FtpClient.prototype.disconnect = function () {
        return new Promise(function (resolve) {
            this._quit()
                .then(function () {
                    clearInterval(this.keepAlive);

                    this.controlSocket.disconnect();
                    this.controlSocket = null;
                    this.isConnected = false;

                    resolve(this);
                }.bind(this));

        }.bind(this));
    };

    FtpClient.prototype.list = function (pathname) {
        var listCmd, listParse;

        if (this.features.mlst) {
            listCmd = '_mlsd';
            listParse = '_parseMlsd';
        } else {
            listCmd = '_list';
            listParse = '_parseList';
        }

        if (typeof pathname !== 'string') {
            pathname = '.';
        }

        return new Promise(function (resolve) {
            var onSuccess = function (list) {
                resolve(this[listParse](list));
            }.bind(this);

            this._pasv()
                .then(this._createDataSocket.bind(this, onSuccess))
                .then(this[listCmd].bind(this, pathname));
        }.bind(this));

    };

    FtpClient.prototype.listDir = function (pathname) {

        if (typeof pathname !== 'string') {
            pathname = '.';
        }

        return new Promise(function (resolve) {
            var onSuccess = function (list) {
                resolve(list.split('\r\n'));
            }.bind(this);

            this._pasv()
                .then(this._createDataSocket.bind(this, onSuccess))
                .then(this['_nlst'].bind(this, pathname));
        }.bind(this));

    };

    FtpClient.prototype._controlCommand = function (cmd, successCode, callback) {
        if (this.controlSocket) {
            var controlSocket = this.controlSocket;

            controlSocket.addResponseListener(function (data) {
                var code = this._responseToCode(data);

                log(data);

                if (code === successCode) {
                    callback.call(this, data);
                }
            }.bind(this));

            controlSocket.sendMessage(cmd + '\n');
        }
    };

    FtpClient.prototype._createDataSocket = function (callback, isText, port) {
        port = Array.prototype.pop.call(arguments);

        var dataSocket = new TcpClient(this.host, port),
            resp = '',
            noDataTimer;

        isText = isText !== false;

        // Overlaod TcpClient to keep data as ArrayBuffer
        if (!isText) {
            dataSocket._onDataRead = function (readInfo) {
                if (readInfo.resultCode > 0 && this.callbacks.recv) {
                    log('onDataRead: ' + readInfo.data.byteLength);
                    this.callbacks.recv(readInfo.data);
                }
            };

            // Overlaod TcpClient to keep data as ArrayBuffer
            dataSocket.sendMessage = function (arrayBuffer, callback) {
                chrome.socket.write(this.socketId, arrayBuffer, this._onWriteComplete.bind(this));

                this.callbacks.sent = callback;
            };
        }

        // Set a shorter interval to check for data
        dataSocket.readTimer = setInterval(dataSocket._periodicallyRead.bind(dataSocket), 10);

        return new Promise(function (resolve) {
            dataSocket.connect(function () {
                dataSocket.addResponseListener(function (data) {
                    if (!isText) {
                        if (resp !== '') {
                            resp = this._arrayBufferConcat(resp, data);
                        } else {
                            resp = data;
                        }
                    } else {
                        resp += data;
                    }
                }.bind(this));

                // Resolve 500ms after no data is received
                clearTimeout(noDataTimer);
                noDataTimer = setTimeout(function () {
                    clearInterval(dataSocket.readTimer);
                    dataSocket.disconnect();
                    dataSocket = null;

                    if (typeof callback === 'function') {
                        callback(resp);
                    }
                }, 500);

                resolve(dataSocket);
            }.bind(this));
        }.bind(this));
    };

    FtpClient.prototype._arrayBufferConcat = function (buf1, buf2) {
        var bufView = new Uint8Array(buf1.byteLength + buf2.byteLength);

        bufView.set(new Uint8Array(buf1), 0);
        bufView.set(new Uint8Array(buf2), buf1.byteLength);

        return bufView.buffer;
    };

    FtpClient.prototype._quit = function () {
        var cmd = 'QUIT';
        return new Promise(function (resolve) {
            this._controlCommand(cmd, 221, resolve);
        }.bind(this));
    };

    FtpClient.prototype._user = function (username) {
        var cmd = 'USER';

        if (username !== undefined) cmd += ' ' + username;

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 331, resolve);
        }.bind(this));
    };

    FtpClient.prototype._pass = function (password) {
        var cmd = 'PASS';

        if (password !== undefined) cmd += ' ' + password;

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 230, resolve);
        }.bind(this));
    };

    FtpClient.prototype._feat = function () {
        var cmd = 'FEAT';

        return new Promise(function (resolve) {
            var parse = function (data) {
                var features = this._parseFeat(data);
                this.features = features;
                resolve(features);
            }.bind(this);

            this._controlCommand(cmd, 211, parse);
        }.bind(this));
    };

    FtpClient.prototype._type = function (type) {
        var cmd = 'TYPE';

        if (type !== undefined)  cmd += ' ' + type;

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 200, resolve);
        }.bind(this));
    };

    FtpClient.prototype._pasv = function () {
        var cmd = 'PASV';

        return new Promise(function (resolve) {
            var parse = function (data) {
                resolve(this._pasvToPort(data));
            }.bind(this);

            this._controlCommand(cmd, 227, parse);
        }.bind(this));
    };

    FtpClient.prototype._list = function (pathname) {
        var cmd = 'LIST';

        if (pathname !== undefined) cmd += ' ' + pathname;

        console.log(cmd);

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 226, resolve);
        }.bind(this));
    };

    FtpClient.prototype._nlst = function (pathname) {
        var cmd = 'NLST';

        if (pathname !== undefined) cmd += ' ' + pathname;

        return new Promise(function (resolve) {
            var parse = function(data){
                log(data)
            }.bind(this);
            this._controlCommand(cmd, 226, parse);
        }.bind(this));
    };

    FtpClient.prototype._mlsd = function (pathname) {
        var cmd = 'MLSD';

        if (pathname !== undefined) cmd += ' ' + pathname;

        return new Promise(function (resolve) {
            // 150 code for start of transfer; 226 for end
            this._controlCommand(cmd, 226, resolve);
        }.bind(this));
    };

    FtpClient.prototype._stat = function (pathname) {
        var cmd = 'STAT';

        if (pathname !== undefined) cmd += ' ' + pathname;

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 211, resolve);
        }.bind(this));
    };


    FtpClient.prototype._pwd = function () {
        var cmd = 'PWD';

        return new Promise(function (resolve) {
            var parse = function (data) {
                resolve(/'(.*?)'/.exec(data)[1]);
            };

            this._controlCommand(cmd, 257, parse);
        }.bind(this));
    };

    FtpClient.prototype._cwd = function (pathname) {
        var cmd = 'CWD';

        if (pathname !== undefined)  cmd += ' ' + pathname;

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 250, resolve);
        }.bind(this));
    };

    FtpClient.prototype._noop = function () {
        var cmd = 'NOOP';

        return new Promise(function (resolve) {
            this._controlCommand(cmd, 200, resolve);
        }.bind(this));
    };

    FtpClient.prototype._responseToCode = function (resp) {
        return +resp.trim().split('\n').slice(-1)[0].substring(0, 3);
    };

    FtpClient.prototype._pasvToPort = function (pasv) {
        var pasvs = pasv.match(/\d+/g);
        return +pasvs[6] + 256 * +pasvs[5];
    };

    FtpClient.prototype._parseFeat = function (feat) {
        var lines = feat.split('\n');
        var features = {};

        lines.forEach(function (line) {
            if (line.indexOf('MLST') !== -1) {
                features.mlst = true;
            } else if (line.indexOf('UTF8') !== -1) {
                features.utf8 = true;
            }
        });

        return  features;
    };

    FtpClient.prototype._parseList = function (list) {
        var lines = list.split('\n');

        function chmod_num(perm) {
            var owner = 0,
                group = 0,
                other = 0;

            if (perm[1] === 'r') owner += 4;
            if (perm[2] === 'w') owner += 2;
            if (perm[3] === 'x') owner += 1;
            if (perm[4] === 'r') group += 4;
            if (perm[5] === 'w') group += 2;
            if (perm[6] === 'x') group += 1;
            if (perm[7] === 'r') other += 4;
            if (perm[8] === 'w') other += 2;
            if (perm[9] === 'x') other += 1;

            return '' + owner + group + other;
        }

        return lines.map(function (line) {
            var props = line.match(/\S+/g);

            if (props === null || props.length < 7) {
                return;
            }

            // Convert string to date
            var m = props[5];
            var d = props[6];
            var yh = props[7];
            var y, h;

            if (yh.indexOf(':') !== -1) {
                y = new Date().getFullYear();
                h = yh;
            } else {
                y = yh;
                h = '00:00';
            }

            return {
                perm: props[0],
                permn: chmod_num(props[0]),
                contentsLength: +props[1],
                owner: props[2],
                group: props[3],
                size: +props[4],
                modify: new Date([y, m, d, h].join(' ')),
                name: props.splice(8, props.length - 8).join(' '),
                isDirectory: /^d/.test(props[0])
            };

        }.bind(this));
    };

    FtpClient.prototype._parseMlsd = function (mlsd) {
        var lines = mlsd.split('\n');

        return lines.map(function (line) {
            var file = {};
            var facts = line.split(';');

            file.name = facts.pop().trim();

            facts.forEach(function (fact) {
                var segs = fact.match(/[^\.=]+/g);
                var value = segs.pop();
                var keyword = segs.pop().toLowerCase();

                file[keyword] = value;
            });

            if (file.modify) {
                // YYYYMMDDHHmm
                var dt = file.modify.match(/(\d{4})(\d{2})(\d{2})(\d{2})/);
                var modify = new Date();

                modify.setFullYear(dt[1]);
                modify.setMonth(+dt[2] - 1);
                modify.setHours(dt[3], dt[4]);
                file.modify = modify;
            }

            file.isDirectory = /dir/.test(file.type);

            return file;
        });
    };

    /**
     * Wrapper function for logging
     */
    function log(msg) {
        console.log(msg);
    }

    /**
     * Wrapper function for error logging
     */
    function error(msg) {
        console.error(msg);
    }

    root.FtpClient = FtpClient;

})(window);