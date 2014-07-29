/*global Audica*/
(function (window, Audica, $) {
    'use strict';

    function AudicaViewError(message) {
        this.message = (message || '');
    }

    AudicaViewError.prototype = new Error();

    //private
    function checkDomElements(dom) {
        for (var selector in dom) {
            if (dom.hasOwnProperty(selector)) {
                if (null === dom[selector] || undefined === dom[selector]) {
                    Audica.trigger('ERROR', new AudicaViewError('"' + selector + '" does not exist in DOM!'));
                }
            }
        }
    }

    function applyCoverArtStyleToOneView(scope) {
        // TODO calculation is wrong
        // maybe calculate a ratio to set correct width height
        scope.Dom.coverArt[0].height = window.innerHeight / 2;
        scope.Dom.coverArt[0].width = window.innerWidth / 2;
        scope.Dom.coverArtBox.css('padding-top', (window.innerHeight - scope.Dom.coverArtBox.height()) / 2);
        scope.Dom.descriptionBox.css('padding-top', (window.innerHeight - scope.Dom.descriptionBox.height()) / 2);
    }


    //module
    function View() {
        this.closePlayerControlViewTimerId = null;
        this.resizeEventTimeoutId = null;
        this.backgroundInterval = null;

        this.positionXClassMap = {
            0: '.artist',
            1: '.album',
            2: '.track',
            3: '.title'
        };

        var viewState = 'player';
        var songBoxPositionY = null;
        var songBoxPositionX = 0;

        //  Getter & Setter
        this.getViewState = function () {
            return viewState;
        };
        this.setViewState = function (newViewState) {
            var oldState = viewState;
            viewState = newViewState;
            Audica.trigger('viewStateChanged', {
                from: oldState,
                to: viewState
            });
        };
        this.getSongBoxPositionX = function () {
            return songBoxPositionX;
        };
        this.setSongBoxPositionX = function (positionX) {
            songBoxPositionX = positionX;
        };
        this.getSongBoxPositionY = function () {
            return songBoxPositionY;
        };
        this.setSongBoxPositionY = function (positionY) {
            songBoxPositionY = positionY;
        };
    }

    View.prototype.Dom = {
        searchView: null,
        searchViewPreview: null,
        playerView: null,
        playerViewPreview: null,
        playerControlView: null,
        coverArtBox: null,
        coverArt: null,
        descriptionBox: null,
        songBox: null,
        playlistBox: null,
        filterBox: null,
        title: null,
        album: null,
        artist: null,
        progressBar: null,
        timeField: null,
        preferencesView: null
    };

    View.prototype.init = function () {
        Audica.on('registerEvents', this.bindEvents.bind(this));
        for (var selector in this.Dom) {
            if (this.Dom.hasOwnProperty(selector)) {
                this.Dom[selector] = $('#' + selector);
            }
        }
        checkDomElements(this.Dom);
        Audica.trigger('domElementsSet');
        this.applyCoverArtStyle();
        this.Dom.searchView.css('left', -1 * $(document).width());
    };

    View.prototype.firstPlayListElement = function () {
        return this.Dom.playlistBox.find('li:first');
    };

    View.prototype.getNthPlayListElement = function (pos) {
        return this.Dom.playlistBox.find('li:nth(' + pos + ')');
    };

    View.prototype.setFirstPlaylistElement = function (li) {
        var firstPlayListElement = this.firstPlayListElement();
        if (firstPlayListElement.length > 0) {
            li.insertBefore(firstPlayListElement);
        } else {
            li.appendTo(this.Dom.playlistBox);
        }
    };

    View.prototype.setSongAsFirstPlaylistElement = function (song) {
        var li = [
            '<li data-song-id="' +song.___id + '">',
            '<span>' + this.encodeHtml(song.artist) + '</span> / ',
            '<span>' + this.encodeHtml(song.album) + '</span> / ',
            '<span>' + this.encodeHtml(song.track) + '.</span> ',
            '<span>' + this.encodeHtml(song.title) + '</span>',
            '</li>'
        ];

        var $li = $(li.join(''));
        this.setFirstPlaylistElement($li);
    };

    View.prototype.clearPlaylist = function () {
        if (this.Dom.playlistBox) {
            this.Dom.playlistBox.empty();
        }
    };

    View.prototype.getFirstPlaylistElement = function () {
        var result = null;
        var elements = this.firstPlayListElement();
        if (elements.length > 0) {
            var songId = elements.data('song-id');
            result = Audica.songDb.query(songId).get()[0];
        }
        return result;
    };

    View.prototype.shuffle = function () {
        var max = this.Dom.playlistBox.find('li').length;
        var pickedSong = Math.floor((Math.random() * max) + 1);
        var elem = this.getNthPlayListElement(pickedSong);
        elem.detach();
        this.setFirstPlaylistElement(elem);
        Audica.trigger('tracklistChanged');
    };

    View.prototype.removeFirstPlaylistElement = function () {
        this.firstPlayListElement().detach();
        Audica.trigger('firstPlayListElementRemoved');
    };

    View.prototype.updateMainView = function (eventData) {
        var song = eventData.song,
            title = song.title,
            album = song.album,
            artist = song.artist;

        this.Dom.title.text(title);
        this.Dom.album.text(album);
        this.Dom.artist.text(artist);
        Audica.trigger('updateMainView');
    };

    View.prototype.fillSongBox = function (songs) {
        var _this = this,
            lis = [];
        songs.forEach(function(song, index){
            var li = [],
                artist = _this.encodeHtml(song.artist),
                album = _this.encodeHtml(song.album),
                track = _this.encodeHtml(song.track),
                title = _this.encodeHtml(song.title);

            li.push('<li data-song-id="' + song.___id + '">');
            li.push('<span class="artist" data-value="' + artist + '">' + artist + '</span> / ');
            li.push('<span class="album" data-value="' + album + '">' + album + '</span> / ');
            li.push('<span class="track" data-value="' + track + '">' + track + '.</span>');
            li.push('<span class="title" data-value="' + title + '">' + title + '</span>');
            li.push('</li>');
            lis[index] = li.join('');
        });
        this.Dom.songBox.html(lis.join(''));
        this.bindSongBoxEvents();
    };

    View.prototype.bindSongBoxEvents = function () {
        var self = this;
        this.Dom.songBox.on('click', 'span', function () {
            var value = $(this).data('value');
            var clazz = $(this).attr('class');
            var yIndex = $(this).closest('li');
            var ul = $(this).closest('ul');
            var elems = ul.find('.' + clazz + '[data-value="' + value + '"]');
            ul.find('.selected').removeClass('selected');
            elems.parent().addClass('selected');
            self.setSongBoxPositionY(yIndex);
            self.setSongBoxPositionX($(this).index());
            self.indicateSongBoxXPosition();
        });
    };

    View.prototype.closePlayerControlView = function () {
        this.Dom.playerControlView.data('open', false);
        this.closePlayerControlViewTimerId = null;
        this.Dom.playerControlView.animate({
            height: '4px'
        });
    };

    View.prototype.applyCoverArtStyle = function () {
        this.Dom.playerView.height(window.innerHeight);
        this.Dom.playerView.width(window.innerWidth);
        applyCoverArtStyleToOneView(this);
        this.Dom.searchView.height(window.innerHeight);
        this.Dom.searchView.width(window.innerWidth);
        this.Dom.preferencesView.height(window.innerHeight);
        this.Dom.preferencesView.width(window.innerWidth);
    };

    View.prototype.updateProgress = function (duration, currentTime) {
        var player = Audica.plugins.player;

        if (!player.paused && duration > 0) {
            this.Dom.progressBar.val(Math.round((currentTime * 100) / duration));
        }
    };

    View.prototype.updateTimings = function (duration, currentTime) {
        if (this.Dom.playerControlView.data('open')) {
            var player = Audica.plugins.player;
            if (!player.paused) {
                if (duration > 0) {
                    duration = Math.round(duration);
                }
                this.Dom.timeField.text(Math.round(currentTime) + ' / ' + duration);
            }
        }
    };

    View.prototype.indicateSongBoxXPosition = function () {
        var currentXClass = this.positionXClassMap[this.getSongBoxPositionX()];
        var songBox = this.Dom.songBox;
        var selectedElems = songBox.find('.selected');
        songBox.find('[positionX]').removeAttr('positionX');
        selectedElems.find(currentXClass).attr('positionX', true);
    };

    View.prototype.bindEvents = function () {
        var _this = this;
        $(document).mousemove(function () {
            var playerControlView = _this.Dom.playerControlView;

            if ('player' === _this.getViewState()) {
                if (null !== _this.closePlayerControlViewTimerId) {
                    window.clearTimeout(_this.closePlayerControlViewTimerId);
                }
                if (!playerControlView.data('open')) {
                    playerControlView.data('open', true);
                    playerControlView.animate({
                        height: '50px'
                    });
                }
                _this.closePlayerControlViewTimerId = window.setTimeout(function () {
                    _this.closePlayerControlView();
                }, 3000);

            }
        });

        this.Dom.coverArt.on('error', function () {
            _this.Dom.coverArt.attr('src', 'images/wholeNote.svg');
        });

        var handleRightZone = function (event) {
            if ('search' === _this.getViewState()) {
                var searchView = _this.Dom.searchView;
                var coverArtBox = _this.Dom.coverArtBox;
                var descriptionBox = _this.Dom.descriptionBox;
                if ('mouseenter' === event.type) {
                    searchView.animate({
                        left: -1 * Math.round($(document).width() * 0.05)
                    });
                } else if ('mouseleave' === event.type) {
                    searchView.animate({
                        left: '0'
                    });
                } else if ('click' === event.type) {
                    searchView.animate({
                        left: -1 * $(document).width()
                    });
                    if (Audica.plugins.player.paused) {
                        Audica.nextSong();
                        Audica.trigger('scrobble');
                    }
                    _this.setViewState('player');
                    coverArtBox.css('padding-top', ($(document).height() - coverArtBox.height()) / 2);
                    descriptionBox.css('padding-top', ($(document).height() - descriptionBox.height()) / 2);
                    _this.Dom.searchViewPreview.show();
                }
            } else if ('player' === _this.getViewState()) {
                if ('mouseenter' === event.type) {
                    _this.Dom.playerView.animate({
                        left: -1 * Math.round($(document).width() * 0.05)
                    });
                } else if ('mouseleave' === event.type) {
                    _this.Dom.playerView.animate({
                        left: 0
                    });
                } else if ('click' === event.type) {
                    _this.Dom.playerView.animate({
                        left: -1 * $(document).width()
                    });
                    _this.setViewState('preferences');
                }
            }
        };

        var selectPlayList = function () {
            if ('playList' !== _this.getViewState()) {
                _this.setViewState('playList');
            }
        };

        var selectSongBox = function () {
            if ('search' !== _this.getViewState()) {
                _this.setViewState('search');
            }
        };

        this.Dom.playerViewPreview.on({
            hover: handleRightZone,
            click: handleRightZone
        });

        this.Dom.playlistBox.on({
            click: selectPlayList
        });

        this.Dom.songBox.on({
            click: selectSongBox
        });

        var handleLeftZone = function (event) {
            var searchView = _this.Dom.searchView;
            var songBox = _this.Dom.songBox;
            var playlistBox = _this.Dom.playlistBox;
            var boxWidth = ($(document).width() / 2) - 22 - 2;
            var boxHeight = $(document).height() - 22;
            if ('player' === _this.getViewState()) {
                if ('mouseenter' === event.type) {
                    searchView.animate({
                        left: -1 * Math.round($(document).width() * 0.95)
                    });
                } else if ('mouseleave' === event.type) {
                    searchView.animate({
                        left: -1 * $(document).width()
                    });
                } else if ('click' === event.type) {
                    _this.Dom.searchViewPreview.hide();
                    songBox.focus();
                    songBox.width(boxWidth);
                    songBox.height(boxHeight);
                    playlistBox.width(boxWidth);
                    playlistBox.height(boxHeight);
                    searchView.height($(document).height());
                    searchView.animate({
                        left: 0
                    });
                    _this.setViewState('search');
                }
            } else if ('preferences' === _this.getViewState()) {
                if ('mouseenter' === event.type) {
                    _this.Dom.playerView.animate({
                        left: -1 * Math.round($(document).width() * 0.95)
                    });
                } else if ('mouseleave' === event.type) {
                    _this.Dom.playerView.animate({
                        left: -1 * $(document).width()
                    });
                } else if ('click' === event.type) {
                    _this.Dom.playerView.animate({
                        left: 0
                    });
                    _this.setViewState('player');
                }
            }
        };

        this.Dom.searchViewPreview.on({
            hover: handleLeftZone,
            click: handleLeftZone
        });

        Audica.on('fillSongBox', function () {
            var currentSongList = Audica.songDb.query().get();
            _this.fillSongBox(currentSongList);
        });

        Audica.on('domElementsSet', this.applyCoverArtStyle.bind(this));
        Audica.on('nextSong', this.applyCoverArtStyle.bind(this));
        Audica.on('previousSong', this.applyCoverArtStyle.bind(this));
        Audica.on('playSong', this.updateMainView.bind(this));

        Audica.on('player:play', this.startBackgroundTask.bind(this));
        Audica.on('player:pause', this.stopBackgroundTask.bind(this));
        Audica.on('player:error', this.stopBackgroundTask.bind(this));
        Audica.on('player:end', this.stopBackgroundTask.bind(this));


        $(window).on('resize', function () {
            window.clearTimeout(_this.resizeEventTimeoutId);
            _this.resizeEventTimeoutId = window.setTimeout(_this.applyCoverArtStyle.bind(_this), 250);
        });
    };

    View.prototype.startBackgroundTask = function(){
        var view = this;
        this.backgroundInterval = window.setInterval(function(){
            var player = Audica.plugins.player,
                duration = player.getDuration(),
                currentTime = player.getCurrentTime();

            view.updateProgress(duration, currentTime);
            view.updateTimings(duration, currentTime);
        }, 1000);
    };

    View.prototype.stopBackgroundTask = function(){
        window.clearInterval(this.backgroundInterval);
    };

    var encodeDecodeElement = $('<div />');
    View.prototype.encodeHtml = function (string) {
        if (typeof string === 'string') {
            return encodeDecodeElement.text(string).html();
        } else {
            return string;
        }
    };

    View.prototype.decodeHtml = function (string) {
        if (typeof string === 'string') {
            return encodeDecodeElement.html(string).text();
        } else {
            return string;
        }
    };

    Audica.view = new View();
}(window, Audica, jQuery));
