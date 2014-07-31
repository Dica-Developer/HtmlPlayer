/*global TAFFY*/
(function (root) {
    'use strict';

    function Db() {
        var _dbName = null;
        this.query = null;
        this.lock = false;

        this.setDbName = function (dbName) {
            _dbName = dbName;
        };

        this.getDbName = function () {
            return _dbName;
        };
    }

    Db.prototype.save = function () {
        var db = this;
        this.lock = true;
        var dbContent = this.query().order('artist asec, album asec, year asec, track asec, title asec').get();
        this.query().remove();
        this.query.insert(dbContent);
        var serializedDb = JSON.stringify(dbContent),
            dbName = this.getDbName();

        root.Audica.plugins.fileSystem.writeFile(
            dbName,
            new Blob([serializedDb], {
                type: 'text/plain'
            }),
            function () {
                db.lock = false;
            }
        );
    };

    Db.prototype.init = function (dbName) {
        var _db = this,
            _timeout = null,
            _dbName = 'db.' + dbName;

        this.setDbName(_dbName);

        root.Audica.plugins.fileSystem.readFile(_dbName, function (dbContent) {
            try {
                _db.query = new TAFFY(JSON.parse(dbContent));
            } catch (error) {
                root.Audica.trigger('ERROR', {
                    message: 'Cannot initialize db with old content. Set it to an empty db.' + error
                });
                _db.query = new TAFFY();
            }
            _db.query.settings({
                cacheSize: 10000,
                onDBChange: function () {
                    if (false === _db.lock) {
                        if (null !== _timeout) {
                            clearTimeout(_timeout);
                        }
                        _timeout = window.setTimeout(function () {
                            _db.save();
                        }, 1000);
                    }
                }
            });
        }, function () {
            _db.query = new TAFFY();
            _db.query.settings({
                cacheSize: 10000,
                onDBChange: function () {
                    if (false === _db.lock) {
                        if (null !== _timeout) {
                            clearTimeout(_timeout);
                        }
                        _timeout = window.setTimeout(function () {
                            _db.save();
                        }, 1000);
                    }
                }
            });
        });
    };

    //EXPORT
    root.Db = Db;

}(window));