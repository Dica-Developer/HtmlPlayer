/*global TAFFY*/
(function (root) {
    'use strict';

    function Db() {
        var _dbName = null;
        this.query = null;

        this.setDbName = function (dbName) {
            _dbName = dbName;
        };

        this.getDbName = function () {
            return _dbName;
        };
    }

    Db.prototype.save = function (db) {
        db.query.sort('artist asec, album asec, year asec, track asec, title asec');
        var serializedDb = JSON.stringify(db),
            dbName = this.getDbName();

        root.Audica.plugins.fileSystem.writeFile(
            dbName,
            new Blob([serializedDb], {
                type: 'text/plain'
            })
        );
    };

    Db.prototype.init = function (dbName) {
        var _db = this,
            _timeout = null,
            _dbName = 'db.' + dbName;

        this.setDbName(_dbName);

        root.Audica.plugins.fileSystem.readFile(_dbName, function (dbContent) {
            try {
                _db.query = TAFFY(JSON.parse(dbContent));
            } catch (error) {
                root.Audica.trigger('ERROR', {
                    message: 'Cannot initialize db with old content. Set it to an empty db.' + error
                });
                _db.query = TAFFY();
            }
            _db.query.settings({
                cacheSize: 10000,
                onDBChange: function () {
                    var dbContent = this;
                    if (null !== _timeout) {
                        clearTimeout(_timeout);
                    }
                    _timeout = window.setTimeout(function () {
                        _db.save(dbContent);
                    }, 1000);
                }
            });
        }, function () {
            _db.query = TAFFY();
            _db.query.settings({
                cacheSize: 10000,
                onDBChange: function () {
                    var dbContent = this;
                    if (null !== _timeout) {
                        clearTimeout(_timeout);
                    }
                    _timeout = window.setTimeout(function () {
                        _db.save(dbContent);
                    }, 1000);
                }
            });
        });
    };

    //EXPORT
    root.Db = Db;

}(window));