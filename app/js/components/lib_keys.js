/*global $:true, Audica:true, document:true,  Mousetrap:true, Hammer */
(function (window, Mousetrap) {
    'use strict';
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

        bindKeysToView.search = function () {
            function findNextByPositionX(dir) {
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

            Mousetrap.bind(['right'], function () {
                var view = Audica.view;
                var x = view.getSongBoxPositionX();
                if (3 === x) {
                    view.setSongBoxPositionX(0);
                } else {
                    view.setSongBoxPositionX(++x);
                }
                view.getSongBoxPositionY().find('span').eq(x).trigger('click');
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
                view.getSongBoxPositionY().find('span').eq(x).trigger('click');
                view.indicateSongBoxXPosition();
            });

            Mousetrap.bind(['up'], function () {
                var prev = null;
                var view = Audica.view;
                if (!view.getSongBoxPositionY()) {
                    view.setSongBoxPositionY(songBox.find('li').eq(0));
                    prev = view.getSongBoxPositionY();
                } else {
                    prev = findNextByPositionX('prev');
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
                prev.find('span').eq(view.getSongBoxPositionX()).trigger('click');
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
                    next = findNextByPositionX('next');
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
                next.find('span').eq(view.getSongBoxPositionX()).trigger('click');
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

            Mousetrap.bind(['enter'], function () {
                var elemsToMove = dom.songBox.find('.selected');
                var clones = elemsToMove.clone();
                clones.animate({
                    opacity: 0
                }, function () {
                    elemsToMove.removeClass('selected');
                    clones.removeClass('selected');
                    clones.css({
                        opacity: 1
                    });
                });
                elemsToMove.addClass('added');
                clones.appendTo(dom.playlistBox);
                dom.playlistBox.find('span').on('click', function () {
                    var thisUL = $(this).closest('ul');
                    var value = $(this).data('value');
                    var elems = thisUL.find('[data-value="' + value + '"]');
                    thisUL.find('.selected').removeClass('selected');
                    elems.parent().addClass('selected');
                });
                Audica.trigger('tracklistChanged');
            });

            var element = document.getElementById('songBoxContainer');
            new Hammer(element).on('doubletap', function () {
                var elemsToMove = dom.songBox.find('.selected');
                var clones = elemsToMove.clone();
                clones.animate({
                    opacity: 0
                }, function () {
                    elemsToMove.removeClass('selected');
                    clones.removeClass('selected');
                    clones.css({
                        opacity: 1
                    });
                });
                elemsToMove.addClass('added');
                clones.appendTo(dom.playlistBox);
                dom.playlistBox.find('span').on('click', function () {
                    var thisUL = $(this).closest('ul');
                    var value = $(this).data('value');
                    var elems = thisUL.find('[data-value="' + value + '"]');
                    thisUL.find('.selected').removeClass('selected');
                    elems.parent().addClass('selected');
                });
                Audica.trigger('tracklistChanged');
            });

            function search() {
                if (null !== filterBoxTimeout) {
                    window.clearTimeout(filterBoxTimeout);
                }
                filterBoxTimeout = window.setTimeout(function () {
                    var currentSongList = [];
                    var filterQuery = filterBox.val();
                    if (null !== filterQuery && undefined !== filterQuery) {
                        // TODO If album medium number is available sort by it first
                        var dbQuery = [
                            {
                                artist: {
                                    likenocase: filterQuery
                                }
                            },
                            {
                                album: {
                                    likenocase: filterQuery
                                }
                            },
                            {
                                genre: {
                                    likenocase: filterQuery
                                }
                            },
                            {
                                title: {
                                    likenocase: filterQuery
                                }
                            }
                        ];
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
            var center = {};
            new Hammer(document.getElementById('pointerCircle')).on('pan', function (event) {
                window.requestAnimationFrame(function () {
                    var outerCircle = $('#outerCircle');
                    var outerCirclePos = outerCircle.position();
                    center.x = (outerCirclePos.left + 100);
                    center.y = (outerCirclePos.top + 100);
                    var siteA = Math.abs(event.center.x - center.x);
                    var siteB = Math.abs(event.center.y - center.y);
                    var siteC = Math.sqrt(Math.pow(siteA, 2) + Math.pow(siteB, 2));
                    if (siteC > 80 && siteC < 120) {
                        var pointer = document.getElementById('pointerCircle');
                        pointer.style.webkitTransform = 'translate3d(' + Math.round(event.center.x - outerCirclePos.left - 24) + 'px, ' + Math.round(event.center.y - outerCirclePos.top - 24) + 'px, 0)';
                    }
                });
            });
            Mousetrap.bind(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '/'], openSearchBox);

            Mousetrap.bind('tab', function () {
                Audica.view.setViewState('playList');
                return false;
            });
        };

        bindKeysToView.playList = function () {
            //new Hammer(element).on('doubletap', function() {});

            Mousetrap.bind(['del'], function () {
                var elems = dom.playlistBox.find('.selected');
                elems.each(function () {
                    var song = dom.songBox.find('[data-song-id="' + $(this).data('song-id') + '"]');
                    song.removeClass('added');
                });
                elems.remove();
                Audica.trigger('tracklistChanged');
            });

            Mousetrap.bind('tab', function () {
                Audica.view.setViewState('search');
                return false;
            });

            Mousetrap.bind('down', function () {
            });
            Mousetrap.bind('up', function () {
            });
        };

        bindKeysToView[Audica.view.getViewState()].call(Audica);
    };
})(window, Mousetrap, Audica);
