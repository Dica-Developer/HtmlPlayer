/*global TAFFY:true, escape:true, unescape:true, console:true, Mousetrap*/
(function (window) {
    'use strict';

    /*global window, document*/

    function Audica() {
        this.plugins = {};
        this.songDb = new window.Db();
        this.historyDb = new window.Db();
        this.eventList = {};
        this.songHistory = [];
        this.song = null;
    function AudicaCoreError(message) {
        this.message = (message || '');
    }
    AudicaCoreError.prototype = new Error();

    Audica.prototype.playSong = function (song) {
        this.song = song;
        this.trigger('onStartPlayingSong', {
            song: song
        });

        this.plugins.player.type = song.contentType;
        var plugin = this.plugins[song.backendId];

        if (plugin) {
            // todo handle again asynchronous src retreive
            var src = plugin.getPlaySrc(song.src, this.plugins.player);
            plugin.setCoverArt(song.coverArt, this.view.Dom.coverArt);
            // TODO move this to a plugin
            this.plugins.player.play(src);
        } else {
            this.trigger('ERROR', new AudicaCoreError('Cannot handle songs from backend ' + song.backendId + '.'));
        }

        this.view.updateMainView(song.artist, song.album, song.title);
        this.trigger('playSong', {
            song: song
        });
    };

    Audica.prototype.nextSong = function () {
        var song = this.view.getFirstPlaylistElement();
        if (null !== song) {
            this.playSong(song);
            this.view.removeFirstPlaylistElement();
            this.historyAdd(song);
            this.trigger('nextSong');
        } else {
            this.trigger('ERROR', new AudicaCoreError('No song found. Possible reason: Empty Playlist'));
        }
    };

    Audica.prototype.previousSong = function () {
        if (this.songHistory.length > 0) {
            var history = this.songHistory.pop();
            var song = this.songDb.query({
                id: history.songId,
                backendId: history.backendId
            }).get()[0];

            if (null !== song && undefined !== song) {
                this.playSong(song);
                this.view.setSongAsFirstPlaylistElement(song);
                this.trigger('previousSong');
            } else {
                this.trigger('ERROR', new AudicaCoreError('No song found. Possible reason: Empty Playlist'));
            }
        } else {
            this.trigger('ERROR', new AudicaCoreError('No song found. Possible reason: Empty History'));
        }
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

        this.trigger('collectSongs');
    };

    Audica.prototype.updateSongList = function () {
        window.Audica.trigger('updateSongList', {
            timestamp: $.now()
        });
        window.Audica.trigger('finished');
    };

    Audica.prototype.backgroundTasks = function () {
        this.view.updateProgress();
        this.view.updateTimings();
        if (this.plugins['scrobbler']) {
            this.plugins['scrobbler'].scrobbleSong();
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
            console.log(args.message);
        });

        this.on('ERROR', function (error) {
            console.error(error.stack);
        });

        this.on('WARN', function (args) {
            console.warn(args.message);
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
        if (!this.eventList[eventName]) {
            return false;
        }
        var args = Array.prototype.slice.call(arguments, 1),
            events = this.eventList[eventName],
            i = 0,
            length = events.length,
            subscription;
        for (; i < length; i++) {
            subscription = events[i];
            subscription.callback.apply(subscription.context, args);
        }
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
        var self = this;
        this.view.init();
        this.registerEvents();
        this.initPlugins();
        window.setInterval(function () {
            self.backgroundTasks();
        }, 1000);
    };

    window.Audica = new Audica();

}(window));
