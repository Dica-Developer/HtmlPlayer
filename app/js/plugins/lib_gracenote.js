/*global Audica, window*/
(function (window, Audica, $) {
    'use strict';

    function prepareUI() {
        var gnPreview = $('<div id="gnPreview">Gracenote suggestion</div>');
        var gnSuggestionsCon = $('<div id="gnSuggestionsCon"></div>');
        var gnSuggestions = $('<div id="gnSuggestions"></div>');

        gnSuggestionsCon.on('click', function () {
            gnSuggestionsCon.animate({
                top: -100
            }, 'slow', function () {
                $(this).data('open', false);
            });
        });
        gnPreview.on('click', function () {
            if (gnSuggestionsCon.data('open')) {
                gnSuggestionsCon.animate({
                    top: -100
                }, 'slow', function () {
                    $(this).data('open', false);
                });
            } else {
                gnSuggestionsCon.animate({
                    top: 20
                }, 'slow', function () {
                    $(this).data('open', true);
                });
            }
        });
        gnSuggestions.appendTo(gnSuggestionsCon);
        gnSuggestionsCon.appendTo('#playerView');
        gnPreview.appendTo('#playerView');
    }

    function addTrackToSuggestions(track) {
        var gnSuggestions = $('#gnSuggestions');
        var suggestedTrack = $('<div class="suggestedTrack"><div class="info"></div><div class="cover"><img src="" /></div></div>');
        suggestedTrack.data('id', track.___id);
        suggestedTrack.find('.info').append('<div class="title">' + track.title + '</div>');
        suggestedTrack.find('.info').append('<div class="artist"><span class="by">by</span> ' + track.artist + '</div>');
        suggestedTrack.find('.cover img').attr('src', track.coverArt);
        suggestedTrack.on('click', function () {
            var id = $(this).data('id');
            var song = Audica.songDb.query({
                '___id': '"' + id
            } + '"').get()[0];
            Audica.playSong(song);
        });
        suggestedTrack.appendTo(gnSuggestions);
        gnSuggestions.width(($('.suggestedTrack').length + 1) * 250);
    }


    function Gracenote() {
        this.db = new window.Db();
        var self = this;
        var url = null;
        var webApiId = null;
        var userId = null;
        //    var backendId = 'Gracenote';

        var authQuery = '<QUERIES><QUERY CMD="REGISTER"><CLIENT>{{webAPI_ID}}</CLIENT></QUERY></QUERIES>';
        var basicQuery = '<QUERIES> <AUTH> <CLIENT>{{webAPI_ID}}</CLIENT> <USER>{{user_ID}}</USER> </AUTH> <LANG>eng</LANG>' +
            '<COUNTRY>usa</COUNTRY> <QUERY CMD="ALBUM_SEARCH"><MODE>SINGLE_BEST</MODE><TEXT TYPE="ARTIST">{{artist}}</TEXT>' +
            '<TEXT TYPE="ALBUM_TITLE">{{album}}</TEXT> </QUERY></QUERIES>';
        var moodSimpleQuery = '<QUERIES> <AUTH> <CLIENT>{{webAPI_ID}}</CLIENT> <USER>{{user_ID}}</USER> </AUTH> <LANG>eng</LANG>' +
            '<COUNTRY>usa</COUNTRY> <QUERY CMD="ALBUM_FETCH"><GN_ID>{{GN_ID}}</GN_ID>' +
            '<OPTION> <PARAMETER>SELECT_EXTENDED</PARAMETER> <VALUE>MOOD,TEMPO</VALUE> </OPTION></QUERY></QUERIES>';

        var req = function (data) {
            return new $.ajax({
                url: url,
                type: 'POST',
                data: data,
                contentType: 'text/xml',
                dataType: 'text'
            });
        };

        var parse = function (resp) {
            var xmlObj = $($.parseXML(resp));
            if (xmlObj.find('RESPONSE').attr('STATUS') === 'ERROR') {
                xmlObj = null;
            }
            return xmlObj;
        };

        var getSingleVal = function (xml, val) {
            return xml.find(val.toUpperCase()).text();
        };

        var getCredentials = function () {
            var clientId = JSON.parse(localStorage.gracenoteClientId) || null;
            webApiId = JSON.parse(localStorage.gracenoteWepApiId) || null;
            if (clientId && webApiId) {
                url = 'https://c' + clientId + '.web.cddbp.net/webapi/xml/1.0/';
                return true;
            } else {
                return false;
            }
        };

        var addMoodToSongDB = function (albumMood, tracksMood) {
            var albumFetch = self.db.query({
                    'gnId': albumMood.id
                }),
                i = 0,
                length = tracksMood.length;

            albumFetch.update({
                genre: albumMood.genre
            });
            albumFetch.update({
                genreId: albumMood.genreId
            });
            albumFetch.update({
                genreNUM: albumMood.genreNUM
            });
            for (i; i < length; ++i) {
                var track = tracksMood[i];
                var trackFetch = self.db.query({
                    'gnId': track.id
                });
                trackFetch.update({
                    mood: track.mood
                });
                trackFetch.update({
                    moodId: track.moodId
                });
                trackFetch.update({
                    tempo: track.tempo
                });
                trackFetch.update({
                    tempoId: track.tempoId
                });
            }
        };

        var extractAlbumGenre = function (xml) {
            return {
                id: xml.find('GN_ID').eq(0).text(),
                genreNUM: xml.find('GENRE').attr('NUM'),
                genreId: xml.find('GENRE').attr('ID'),
                genre: xml.find('GENRE').text()
            };
        };

        var extractTracksMood = function (xml) {
            var tracks = xml.find('TRACK'),
                ret = [],
                i = 0,
                length = tracks.length;
            for (i; i < length; ++i) {
                var track = tracks.eq(i);
                ret[ret.length] = {
                    id: track.find('GN_ID').text(),
                    mood: track.find('MOOD').text(),
                    moodId: track.find('MOOD').attr('ID'),
                    tempo: track.find('TEMPO').text(),
                    tempoId: track.find('TEMPO').attr('ID')
                };
            }
            return ret;
        };

        var extractMoodInformations = function (resp) {
            var xml = parse(resp);
            if (null !== xml) {
                var albumMood = extractAlbumGenre(xml),
                    tracksMood = extractTracksMood(xml);
                addMoodToSongDB(albumMood, tracksMood);
            }
        };

        var collectMoodInformations = function (id) {
            var data = moodSimpleQuery.replace('{{webAPI_ID}}', webApiId).replace('{{user_ID}}', userId)
                .replace('{{GN_ID}}', id);
            req(data).success(extractMoodInformations);
        };

        var createDbEntry = function (isAlbum, gnId, backendId, songId) {
            if (self.db.query({
                'gn_id': gnId
            }).count() === 0) {
                self.db.query.insert({
                    'gnId': gnId,
                    'backendId': backendId,
                    'songId': songId
                });
                if (isAlbum) {
                    collectMoodInformations(gnId);
                }
            }
        };

        var extractAlbum = function (xml) {
            return {
                id: xml.find('GN_ID').eq(0).text(),
                album: xml.find('TITLE').eq(0).text(),
                artist: xml.find('ARTIST').eq(0).text()
            };
        };

        var extractTracks = function (xml) {
            var tracks = xml.find('TRACK'),
                ret = [],
                i = 0,
                length = tracks.length;
            for (i; i < length; ++i) {
                var track = tracks.eq(i),
                    gnIdTrack = track.find('GN_ID').text(),
                    trackTitle = track.find('TITLE').text();
                ret[ret.length] = {
                    id: gnIdTrack,
                    title: trackTitle
                };
            }
            return ret;
        };

        var addIdToSongDB = function (album, tracks) {
            createDbEntry(true, album.id);
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                var count = Audica.songDb.query({
                    'album': {
                        likenocase: album.album
                    }
                }, {
                    'artist': {
                        likenocase: album.artist
                    }
                }, {
                    'title': {
                        likenocase: track.title
                    }
                }).count();
                if (count !== 0) {
                    var entries = Audica.songDb.query({
                        'album': {
                            likenocase: album.album
                        }
                    }, {
                        'artist': {
                            likenocase: album.artist
                        }
                    }, {
                        'title': {
                            likenocase: track.title
                        }
                    }).get();
                    for (var j = 0; j < entries.length; j++) {
                        var entry = entries[j];
                        createDbEntry(false, track.id, entry.backendId, entry.id, entry.album, entry.artist);
                    }
                }
            }
        };

        var extractBasicInformations = function (resp) {
            var xml = parse(resp);
            if (null !== xml) {
                var album = extractAlbum(xml),
                    tracks = extractTracks(xml);
                addIdToSongDB(album, tracks);
            }
        };

        this.collectBasicInformations = function (unmatchedElems) {
            var i = 0,
                length = unmatchedElems.length;
            for (i; i < length; i++) {
                var arr = unmatchedElems[i];
                var data = basicQuery.replace('{{webAPI_ID}}', webApiId).replace('{{user_ID}}', userId)
                    .replace('{{artist}}', encodeURIComponent(arr[1])).replace('{{album}}', encodeURIComponent(arr[0]));
                req(data).success(extractBasicInformations);
            }
        };

        var findUntrackedSongs = function () {
            var untrackedSongs = [];
            var trackedSongs = self.db.query({
                'song_id': {
                    isUndefined: false
                }
            }).select('song_id');
            var songs = Audica.songDb.query().select('id');
            for (var i = 0; i < songs.length; i++) {
                var songID = songs[i];
                if ($.inArray(songID, trackedSongs) === -1) {
                    var match = Audica.songDb.query({
                        'id': songID
                    }).select('album', 'artist')[0];
                    untrackedSongs[untrackedSongs.length] = {
                        album: match[0],
                        artist: match[1]
                    };
                }
            }
            var tmpDB = new window.Db();
            tmpDB.init('tmp');
            tmpDB.query.insert(untrackedSongs);
            var ret = tmpDB.query().distinct('album', 'artist');
            tmpDB.query().remove();
            return ret;
        };

        Audica.on('authReady', function () {
            prepareUI();
            var untrackedSongs = findUntrackedSongs();
            self.collectBasicInformations(untrackedSongs);
        });

        this.init = function () {
            self.db.init('plugin_gracenote');
            if (getCredentials()) {
                req(authQuery.replace('{{webAPI_ID}}', webApiId)).success(function (resp) {
                    var xml = parse(resp);
                    userId = getSingleVal(xml, 'user');
                    Audica.trigger('authReady');
                    Audica.trigger('initReady');
                });
            } else {
                Audica.trigger('WARN', 'Gracenote disabled!');
                Audica.trigger('initReady');
            }
        };

        $(window).on('beforeunload', function () {
            self.db.save();
        });

        Audica.on('playSong', function (args) {
            var gnPreview = $('#gnPreview');
            gnPreview.hide();
            var song = args.song;
            var gnId = self.db.query({
                'backendId': song.backendId
            }, {
                'songId': song.id
            }).select('gn_id');
            if (gnId.length !== 0) {
                $('#gnSuggestions').empty();
                gnPreview.show('slow');
                var currentSongMetadata = self.db.query({
                    'gnId': gnId[0]
                }).select('mood', 'tempo');
                var mood = currentSongMetadata[0][0];
                var byMood = self.db.query({
                    'mood': mood
                }).get();
                for (var i = 0; i < byMood.length; i++) {
                    var obj = byMood[i];
                    var trackList = Audica.songDb.query({
                        'backendId': obj.backendId
                    }, {
                        'id': obj.songId
                    }).get();
                    for (var j = 0; j < trackList.length; j++) {
                        var track = trackList[j];
                        addTrackToSuggestions(track);
                    }
                }
            }
        });
    }


    Audica.on('updateSongList', function (args) {
        _receiveList(args.timestamp);
    });

    Audica.extend('gracenote', new Gracenote());
})(window, Audica, jQuery);
