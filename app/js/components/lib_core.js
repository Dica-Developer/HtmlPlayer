/*global window*/
(function (window, $) {
    'use strict';

    function Audica() {
    }

    Audica.prototype.plugins = {};

    Audica.prototype.eventList = {};

    Audica.prototype.songHistory = [];

    Audica.prototype.song = null;

    Audica.prototype.songDb = new window.Db();

    Audica.prototype.historyDb = new window.Db();

    Audica.prototype.playSong = function (song) {

        if (!song) {
            this.trigger('ERROR', new Error('Song is ' + typeof song));
            return;
        }

        this.song = song;
        this.plugins.player.type = song.contentType;
        var plugin = this.plugins[song.backendId];

        if (!plugin) {
            this.trigger('ERROR', new Error('Cannot handle songs from backend ' + song.backendId + '.'));
            return;
        }

        this.trigger('onStartPlayingSong', { song: song });


        // todo handle again asynchronous src retreive
        var src = plugin.getPlaySrc(song.src, this.plugins.player);
        plugin.setCoverArt(song.coverArt, this.view.Dom.coverArt);
        // TODO move this to a plugin
        this.plugins.player.play(src);

        this.trigger('playSong', { song: song });
    };

    Audica.prototype.nextSong = function () {
        var song = this.view.getFirstPlaylistElement();
        if (!song) {
            this.trigger('ERROR', new Error('No song found. Possible reason: Empty Playlist'));
            return;
        }

        this.playSong(song);
        this.view.removeFirstPlaylistElement();
        this.historyAdd(song);
        this.trigger('nextSong');
    };

    Audica.prototype.previousSong = function () {
        if (this.songHistory.length < 1) {
            this.trigger('ERROR', new Error('No song found. Possible reason: Empty History'));
            return;
        }

        var history = this.songHistory.pop(),
            song = this.songDb.query({
                id: history.songId,
                backendId: history.backendId
            }).get()[0];

        if (!song) {
            this.trigger('ERROR', new Error('No song found. Possible reason: Empty Playlist'));
            return;
        }

        this.playSong(song);
        this.view.setSongAsFirstPlaylistElement(song);
        this.trigger('previousSong');
    };

    Audica.prototype.getLastSong = function () {
        return this.songHistory[this.songHistory.length - 1] || null;
    };

    Audica.prototype.collectSongs = function (songList, backendId, timestamp) {
        this.songDb.query.insert(songList);
        this.songDb.query({
            backendId: {
                is: backendId
            },
            addedOn: {
                '!is': timestamp
            }
        }).remove();
    };

    Audica.prototype.updateSongList = function () {
        this.trigger('updateSongList', {
            timestamp: $.now()
        });
        this.trigger('finished');
    };

    Audica.prototype.backgroundTasks = function () {
        if (this.plugins.scrobbler) {
            this.plugins.scrobbler.scrobbleSong();
        }
    };

    Audica.prototype.historyAdd = function () {
        var historyElem = {
            timestamp: $.now(),
            backendId: this.song.backendId,
            songId: this.song.id
        };
        this.songHistory.push(historyElem);
        this.historyDb.query.insert(historyElem);
    };

    Audica.prototype.historyShowByTime = function (direction) {
        return this.historyDb.query().order('timestamp ' + direction).get();
    };

    Audica.prototype.registerEvents = function () {
        var self = this;
        window.bindKeyEvents(this);

        this.on('INFO', function (args) {
            window.console.log(args.message);
        });

        this.on('ERROR', function (error) {
            window.console.error(error.stack);
        });

        this.on('WARN', function (args) {
            window.console.warn(args.message);
        });

        this.on('readyCollectingSongs', function (args) {
            self.collectSongs(args.songList, args.backendId, args.timestamp);
        });

        this.on('initReady', function () {
        });

        this.on('fileSystemInitReady', function () {
            this.songDb.init('song');
            this.historyDb.init('history');
        });

        this.trigger('registerEvents');
    };

    Audica.prototype.cleanup = function () {
        for (var plugin in this.plugins) {
            if (this.plugins.hasOwnProperty(plugin)) {
                if (this.plugins[plugin].db instanceof Function) {
                    this.plugins[plugin].db.save.call();
                }
            }
        }
    };

    Audica.prototype.on = function (eventName, fn) {
        if (!this.eventList[eventName]) {
            this.eventList[eventName] = [];
        }
        this.eventList[eventName].push({
            context: this,
            callback: fn
        });
        return this;
    };

    Audica.prototype.trigger = function (eventName) {
        var args = Array.prototype.slice.call(arguments, 1),
            events = this.eventList[eventName];

        if (!events) {
            return false;
        }

        events.forEach(function (subscription) {
            subscription.callback.apply(subscription.context, args);
        });
        return this;
    };

    Audica.prototype.extend = function (name, fn) {
        this.plugins[name] = fn;
    };

    Audica.prototype.initPlugins = function () {
        for (var name in this.plugins) {
            if (this.plugins.hasOwnProperty(name)) {
                if (this.plugins[name].init instanceof Function) {
                    this.plugins[name].init.call(this);
                }
            }
        }
    };

    Audica.prototype.start = function () {
        this.view.init();
        this.registerEvents();
        this.initPlugins();
        window.setInterval(this.backgroundTasks.bind(this), 1000);
    };

    window.Audica = new Audica();

}(window, jQuery));
