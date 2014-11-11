/*global $:true, Audica:true, document:true,  Mousetrap:true, Hammer */
(function (window, Mousetrap) {
    'use strict';

    function findNextPlaylistBoxByPositionX(dir) {
        var view = Audica.view;
        var currentXClass = view.positionXClassMap[view.getPlaylistBoxPositionX()];
        var currentXValue = view.getPlaylistBoxPositionY().find(currentXClass).data('value');
        var tmpNext = view.getPlaylistBoxPositionY();
        //TODO maybe replace with for loop (secure)
        while (tmpNext.find(currentXClass).data('value') === currentXValue) {
            tmpNext = tmpNext[dir]();
        }
        return tmpNext;
    }

    function findNextSongBoxByPositionX(dir) {
        var view = Audica.view;
        var currentXClass = view.positionXClassMap[view.getSongBoxPositionX()];
        var currentXValue = view.getSongBoxPositionY().find(currentXClass).data('value');
        var tmpNext = view.getSongBoxPositionY();
        //TODO maybe replace with for loop (secure)
        while (tmpNext.find(currentXClass).data('value') === currentXValue) {
            tmpNext = tmpNext[dir]();
        }
        return tmpNext;
    }

    window.bindKeyEvents = function (Audica) {
        var bindKeysToView = {};
        var dom = Audica.view.Dom;
        var audio = Audica.plugins.player;
        var songBox = dom.songBox;
        var playlistBox = dom.playlistBox;
        var searchView = dom.searchView;
        var boxWidth = ($(document).width() / 2) - 22 - 2;
        var boxHeight = $(document).height() - 22;
        var playerView = dom.playerView;
        var coverArtBox = dom.coverArtBox;
        var filterBox = dom.filterBox;
        var descriptionBox = dom.descriptionBox;
        var filterBoxTimeout = null;

        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        Audica.on('viewStateChanged', function (args) {
            Mousetrap.reset();
            $('body').off('click');
            if (bindKeysToView[args.to]) {
                bindKeysToView[args.to].call(this);
                if (args.to === 'search' && dom.songBox.find('li').length === 0) {
                    Audica.trigger('fillSongBox');
                }
            }
        });

        bindKeysToView.preferences = function () {
            Mousetrap.bind(['escape'], function () {
                playerView.animate({
                    left: 0
                });
                Audica.view.setViewState('player');
            });
        };

        bindKeysToView.player = function () {
            var $body = $('body');

            function forward() {
                audio.forwardSeconds(10);
            }

            $body.on('click', '#forwardButton', forward);
            Mousetrap.bind(['right'], forward);

            function rewind() {
                audio.rewindSeconds(10);
            }

            $body.on('click', '#rewindButton', rewind);
            Mousetrap.bind(['left'], rewind);

            Mousetrap.bind(['shift+up'], function () {
                audio.volumeUp(0.02);
            });

            Mousetrap.bind(['shift+down'], function () {
                audio.volumeDown(0.02);
            });

            Mousetrap.bind(['s'], function () {
                Audica.shuffle();
            });

            Mousetrap.bind(['l'], function () {
                songBox.focus();
                songBox.width(boxWidth);
                songBox.height(boxHeight);
                playlistBox.width(boxWidth);
                playlistBox.height(boxHeight);
                searchView.height($(document).height());
                searchView.animate({
                    left: 0
                });
                Audica.view.setViewState('search');
                dom.searchViewPreview.hide();
            });

            function next() {
                Audica.nextSong();
                Audica.trigger('scrobble');
            }

            $body.on('click', '#nextButton', next);
            Mousetrap.bind(['n'], next);

            function previous() {
                Audica.trigger('scroll', {
                    dir: 'up'
                });
                Audica.previousSong();
                Audica.trigger('scrobble');
            }

            $body.on('click', '#prevButton', previous);
            Mousetrap.bind(['p'], previous);

            function togglePlay() {
                var $playPauseButton = $('#playPauseButton');

                if (audio.paused) {
                    $playPauseButton.removeClass('playButton');
                    $playPauseButton.addClass('pauseButton');
                    audio.play();
                } else {
                    $playPauseButton.addClass('playButton');
                    $playPauseButton.removeClass('pauseButton');
                    audio.pause();
                }
            }

            $body.on('click', '#playPauseButton', togglePlay);
            Mousetrap.bind(['space'], togglePlay);
        };

        bindKeysToView.playList = function () {

            var element = document.getElementById('playlistBoxContainer');
            new Hammer(element).on('doubletap', removePlaylistElements);
            Mousetrap.bind(['del'], removePlaylistElements);
            Mousetrap.bind(['enter'], removePlaylistElements);

            Mousetrap.bind('tab', function () {
                Audica.view.setViewState('search');
                return false;
            });

            Mousetrap.bind(['right'], function () {
                var view = Audica.view;
                var x = view.getPlaylistBoxPositionX();
                if (3 === x) {
                    view.setPlaylistBoxPositionX(0);
                } else {
                    view.setPlaylistBoxPositionX(++x);
                }
                Audica.trigger('view:selectInPlaylistBox', {
                    element: view.getPlaylistBoxPositionY().find('span').eq(x)[0]
                });
                view.indicatePlaylistBoxXPosition();
            });

            Mousetrap.bind(['left'], function () {
                var view = Audica.view;
                var x = view.getPlaylistBoxPositionX();
                if (0 === x) {
                    view.setPlaylistBoxPositionX(3);
                } else {
                    view.setPlaylistBoxPositionX(--x);
                }
                Audica.trigger('view:selectInPlaylistBox', {
                    element: view.getPlaylistBoxPositionY().find('span').eq(x)[0]
                });
                view.indicatePlaylistBoxXPosition();
            });

            Mousetrap.bind(['up'], function () {
                var prev = null;
                var view = Audica.view;
                if (!view.getPlaylistBoxPositionY()) {
                    view.setPlaylistBoxPositionY(playlistBox.find('li').eq(0));
                    prev = view.getPlaylistBoxPositionY();
                } else {
                    prev = findNextPlaylistBoxByPositionX('prev');
                    view.getPlaylistBoxPositionY().removeClass('active');
                    if (prev.length === 0) {
                        prev = dom.playlistBox.find('li').last();
                    }
                }
                var halfWindowSize = window.innerHeight / 2;
                var scrollPos = Math.abs(playlistBox.parent().scrollTop() + prev.position().top) - halfWindowSize;
                playlistBox.parent().scrollTop(scrollPos);
                prev.addClass('active');
                view.setPlaylistBoxPositionY(prev);
                Audica.trigger('view:selectInPlaylistBox', {
                    element: prev.find('span').eq(view.getPlaylistBoxPositionX())[0]
                });
                view.indicatePlaylistBoxXPosition();
            });

            Mousetrap.bind(['down'], function () {
                var next = null;
                var view = Audica.view;
                if (!view.getPlaylistBoxPositionY()) {
                    view.setPlaylistBoxPositionY(playlistBox.find('li').eq(0));
                    next = view.getPlaylistBoxPositionY();
                } else {
                    next = findNextPlaylistBoxByPositionX('next');
                    view.getPlaylistBoxPositionY().removeClass('active');
                    if (next.length === 0) {
                        next = playlistBox.find('li').eq(0);
                    }
                }
                var halfWindowSize = window.innerHeight / 2;
                var scrollPos = Math.abs(next.position().top + playlistBox.parent().scrollTop()) - halfWindowSize;
                playlistBox.parent().scrollTop(scrollPos);
                next.addClass('active');
                view.setPlaylistBoxPositionY(next);
                Audica.trigger('view:selectInPlaylistBox', {
                    element: next.find('span').eq(view.getPlaylistBoxPositionX())[0]
                });
                view.indicatePlaylistBoxXPosition();
            });

            Mousetrap.bind(['escape'], function () {
                searchView.animate({
                    left: -1 * $(document).width()
                });
                if (audio.paused) {
                    Audica.nextSong();
                    Audica.trigger('scrobble');
                    var $playPauseButton = $('#playPauseButton');

                    $playPauseButton.removeClass('playButton');
                    $playPauseButton.addClass('pauseButton');
                }
                Audica.view.setViewState('player');
                coverArtBox.css('padding-top', ($(document).height() - coverArtBox.height()) / 2);
                descriptionBox.css('padding-top', ($(document).height() - descriptionBox.height()) / 2);
                dom.searchViewPreview.show();
            });
        };

        bindKeysToView.search = function () {

            Mousetrap.bind(['right'], function () {
                var view = Audica.view;
                var x = view.getSongBoxPositionX();
                if (3 === x) {
                    view.setSongBoxPositionX(0);
                } else {
                    view.setSongBoxPositionX(++x);
                }
                Audica.trigger('view:selectInSongBox', {
                    element: view.getSongBoxPositionY().find('span').eq(x)[0]
                });
                view.indicateSongBoxXPosition();
            });

            Mousetrap.bind(['left'], function () {
                var view = Audica.view;
                var x = view.getSongBoxPositionX();
                if (0 === x) {
                    view.setSongBoxPositionX(3);
                } else {
                    view.setSongBoxPositionX(--x);
                }
                Audica.trigger('view:selectInSongBox', {
                    element: view.getSongBoxPositionY().find('span').eq(x)[0]
                });
                view.indicateSongBoxXPosition();
            });

            Mousetrap.bind(['up'], function () {
                var prev = null;
                var view = Audica.view;
                if (!view.getSongBoxPositionY()) {
                    view.setSongBoxPositionY(songBox.find('li').eq(0));
                    prev = view.getSongBoxPositionY();
                } else {
                    prev = findNextSongBoxByPositionX('prev');
                    view.getSongBoxPositionY().removeClass('active');
                    if (prev.length === 0) {
                        prev = dom.songBox.find('li').last();
                    }
                }
                var halfWindowSize = window.innerHeight / 2;
                var scrollPos = Math.abs(songBox.parent().scrollTop() + prev.position().top) - halfWindowSize;
                songBox.parent().scrollTop(scrollPos);
                prev.addClass('active');
                view.setSongBoxPositionY(prev);
                Audica.trigger('view:selectInSongBox', {
                    element: prev.find('span').eq(view.getSongBoxPositionX())[0]
                });
                view.indicateSongBoxXPosition();
            });

            Mousetrap.bind(['down'], function () {
                if (filterBox.data.open) {
                    filterBox.data('open', false);
                    filterBox.blur();
                    songBox.focus();
                    filterBox.hide();
                    filterBox.val('');
                }
                var next = null;
                var view = Audica.view;
                if (!view.getSongBoxPositionY()) {
                    view.setSongBoxPositionY(songBox.find('li').eq(0));
                    next = view.getSongBoxPositionY();
                } else {
                    next = findNextSongBoxByPositionX('next');
                    view.getSongBoxPositionY().removeClass('active');
                    if (next.length === 0) {
                        next = songBox.find('li').eq(0);
                    }
                }
                var halfWindowSize = window.innerHeight / 2;
                var scrollPos = Math.abs(next.position().top + songBox.parent().scrollTop()) - halfWindowSize;
                songBox.parent().scrollTop(scrollPos);
                next.addClass('active');
                view.setSongBoxPositionY(next);
                Audica.trigger('view:selectInSongBox', {
                    element: next.find('span').eq(view.getSongBoxPositionX())[0]
                });
                view.indicateSongBoxXPosition();
            });

            Mousetrap.bind(['escape'], function () {
                if (filterBox.data('open')) {
                    filterBox.data('open', false);
                    filterBox.blur();
                    songBox.focus();
                    filterBox.hide();
                    filterBox.val('');
                } else {
                    searchView.animate({
                        left: -1 * $(document).width()
                    });
                    if (audio.paused) {
                        Audica.nextSong();
                        Audica.trigger('scrobble');
                        var $playPauseButton = $('#playPauseButton');

                        $playPauseButton.removeClass('playButton');
                        $playPauseButton.addClass('pauseButton');
                    }
                    Audica.view.setViewState('player');
                    coverArtBox.css('padding-top', ($(document).height() - coverArtBox.height()) / 2);
                    descriptionBox.css('padding-top', ($(document).height() - descriptionBox.height()) / 2);
                    dom.searchViewPreview.show();
                }
            });

            function addSongSelectionToPlayList() {
                var firstSelected = dom.songBox.find('.selected').eq(0);
                var elemToAdd = firstSelected.find('[positionx="true"]');
                if (elemToAdd.size() > 0) {
                    var dbQueryValue = elemToAdd.data('value');
                    var dbQueryKey = elemToAdd.attr('class');
                    var query = {};
                    var term = typeof dbQueryValue === 'string' ? 'likenocase' : '===';
                    query[dbQueryKey] = {};
                    query[dbQueryKey][term] = dbQueryValue;
                    var result = Audica.songDb.query(query).get();
                    Audica.trigger('fillPlaylist', {
                        songs: result
                    });
                }
            }

            Mousetrap.bind(['enter'], addSongSelectionToPlayList);

            var element = document.getElementById('songBoxContainer');
            new Hammer(element).on('doubletap', addSongSelectionToPlayList);

            function search() {
                if (null !== filterBoxTimeout) {
                    window.clearTimeout(filterBoxTimeout);
                }
                filterBoxTimeout = window.setTimeout(function () {
                    var currentSongList = [];
                    var filterQuery = filterBox.val();
                    if (null !== filterQuery && undefined !== filterQuery) {
                        // TODO If album medium number is available sort by it first
                        var dbQuery = [{
                            artist: {
                                likenocase: filterQuery
                            }
                        }, {
                            album: {
                                likenocase: filterQuery
                            }
                        }, {
                            genre: {
                                likenocase: filterQuery
                            }
                        }, {
                            title: {
                                likenocase: filterQuery
                            }
                        }];
                        currentSongList = Audica.songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
                    } else {
                        currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
                    }
                    Audica.view.fillSongBox(currentSongList);
                }, 500);
            }

            function openSearchBox() {
                if (!filterBox.data('open')) {
                    filterBox.data('open', true);
                    filterBox.show();
                    filterBox.focus();
                    filterBox.on('keyup', search);
                    filterBox.one('blur', function () {
                        filterBox.off('keyup', '**');
                        filterBox.data('open', false);
                        filterBox.hide();
                        songBox.focus();
                    });
                }
            }

            new Hammer(element).on('press', function () {
                openSearchBox();
            });

            //CIRCLE Navigation
            var center = {},
                lastAngle = null,
                lastTime = 0,
                abs = Math.abs,
                round = Math.round,
                direction = null;

            new Hammer(document.getElementById('pointerCircle')).on('pan', function (event) {
                window.requestAnimationFrame(function () {
                    var outerCircle = $('#outerCircle'),
                        outerCirclePos = outerCircle.position(),
                        eventX = event.center.x,
                        eventY = event.center.y;

                    center.x = (outerCirclePos.left + 100);
                    center.y = (outerCirclePos.top + 100);

                    var circleX = center.x,
                        circleY = center.y,
                        siteA = abs(eventX - circleX),
                        siteB = abs(eventY - circleY),
                        siteC = Math.sqrt(Math.pow(siteA, 2) + Math.pow(siteB, 2));

                    if (siteC > 80 && siteC < 120) {
                        var pointer = document.getElementById('pointerCircle'),
                            angle = siteB / siteC,
                            deltaAngleAbs = 0,
                            deltaAngle = 0;

                        if (null !== lastAngle) {
                            deltaAngle = lastAngle - angle;
                        }

                        pointer.style.webkitTransform = 'translate3d(' + round(eventX - outerCirclePos.left - 24) + 'px, ' + round(eventY - outerCirclePos.top - 24) + 'px, 0)';
                        if ((eventX - circleX) > 0) {
                            if ((eventY - circleY) > 0) {
                                // quadrant 2
                                angle = 1 + angle;
                                direction = (deltaAngle < 0) ? 'clockwise' : 'counterclockwise';
                            } else if ((eventY - circleY) < 0) {
                                // quadrant 1
                                angle = (1 - angle);
                                direction = (deltaAngle > 0) ? 'clockwise' : 'counterclockwise';
                            }
                        } else /*if ((eventX - circleX) < 0)*/ {
                            if ((eventY - circleY) > 0) {
                                angle = 2 + (1 - angle);
                                direction = (deltaAngle > 0) ? 'clockwise' : 'counterclockwise';
                            } else if ((eventY - circleY) < 0) {
                                // quadrant 4
                                angle = 3 + angle;
                                direction = (deltaAngle < 0) ? 'clockwise' : 'counterclockwise';
                            }
                        }
                        var speed = 0;
                        if (lastTime > 0) {
                            if (null !== lastAngle) {
                                deltaAngle = lastAngle - angle;
                                deltaAngleAbs = abs(deltaAngle);
                            }
                            console.log('here ' + (deltaAngleAbs / ((new Date()).getTime() - lastTime)) + ' - ' + angle);
                            speed = (deltaAngleAbs / ((new Date()).getTime() - lastTime));
                        }
                        lastAngle = angle;
                        lastTime = (new Date()).getTime();
                        if (speed > 0.0002 && speed < 0.001) {
                            Audica.trigger('circle.' + direction, {
                                delta: deltaAngleAbs
                            });
                        }
                    }
                });
            });
            Audica.on('circle.counterclockwise', function () {
                Mousetrap.trigger('down');
            });
            Audica.on('circle.clockwise', function () {
                Mousetrap.trigger('up');
            });
            Mousetrap.bind(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '/'], openSearchBox);

            Mousetrap.bind('tab', function () {
                Audica.view.setViewState('playList');
                return false;
            });
        };

        function removePlaylistElements() {
            var elems = dom.playlistBox.find('.selected');
            elems.each(function () {
                var song = dom.songBox.find('[data-song-id="' + $(this).data('song-id') + '"]');
                song.removeClass('added');
            });
            elems.remove();
            Audica.trigger('tracklistChanged');
        }

        bindKeysToView[Audica.view.getViewState()].call(Audica);
    };
})(window, Mousetrap, Audica);
