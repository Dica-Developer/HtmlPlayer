/*global Audica, window*/
(function(window, Audica, $) {
  'use strict';

  function prepareUI() {
    var gnPreview = $('<div id="gnPreview">Gracenote suggestion</div>');
    var gnSuggestionsCon = $('<div id="gnSuggestionsCon"></div>');
    var gnSuggestions = $('<div id="gnSuggestions"></div>');

    gnSuggestionsCon.on('click', function() {
      gnSuggestionsCon.animate({
        top: -100
      }, 'slow', function() {
        $(this).data('open', false);
      });
    });
    gnPreview.on('click', function() {
      if (gnSuggestionsCon.data('open')) {
        gnSuggestionsCon.animate({
          top: -100
        }, 'slow', function() {
          $(this).data('open', false);
        });
      } else {
        gnSuggestionsCon.animate({
          top: 20
        }, 'slow', function() {
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
    suggestedTrack.data('songId', track.id);
    suggestedTrack.data('backendId', track.backendId);
    suggestedTrack.find('.info').append('<div class="title">' + track.title + '</div>');
    suggestedTrack.find('.info').append('<div class="artist"><span class="by">by</span> ' + track.artist + '</div>');
    suggestedTrack.find('.cover img').attr('src', track.coverArt);
    suggestedTrack.on('click', function() {
      var songId = $(this).data('songId');
      var backendId = $(this).data('backendId');
      var song = Audica.songDb.query({
        'id': songId
      }, {
        'backendId': backendId
      }).first();
      if (song) {
        Audica.playSong(song);
      }
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

    var authQuery = '<QUERIES><QUERY CMD="REGISTER"><CLIENT>{{webAPI_ID}}</CLIENT></QUERY></QUERIES>';
    var moodSimpleQuery = '<QUERIES><AUTH><CLIENT>{{webAPI_ID}}</CLIENT><USER>{{user_ID}}</USER></AUTH>' +
      '<QUERY CMD="ALBUM_SEARCH"><MODE>SINGLE_BEST</MODE>' +
      '<TEXT TYPE="ARTIST">{{artist}}</TEXT>' +
      '<TEXT TYPE="ALBUM_TITLE">{{album}}</TEXT>' +
      '<TEXT TYPE="TRACK_TITLE">{{title}}</TEXT>' +
      '<OPTION><PARAMETER>SELECT_EXTENDED</PARAMETER><VALUE>MOOD,TEMPO</VALUE>' +
      '<OPTION><PARAMETER>SELECT_DETAIL</PARAMETER><VALUE>GENRE:3LEVEL,MOOD:3LEVEL,TEMPO:3LEVEL</VALUE></OPTION></OPTION>' +
      '</QUERY></QUERIES>';

    var req = function(data) {
      return new $.ajax({
        url: url,
        type: 'POST',
        data: data,
        contentType: 'text/xml',
        dataType: 'text '
      });
    };

    var parse = function(resp) {
      var xmlObj = $($.parseXML(resp));
      if (xmlObj.find('RESPONSE').attr('STATUS') === 'ERROR') {
        xmlObj = null;
      }
      return xmlObj;
    };

    var getSingleVal = function(xml, val) {
      return xml.find(val.toUpperCase()).text();
    };

    var getCredentials = function() {
      var clientId = JSON.parse(localStorage.gracenoteClientId) || null;
      webApiId = JSON.parse(localStorage.gracenoteWepApiId) || null;
      if (clientId && webApiId) {
        url = 'https://c' + clientId + '.web.cddbp.net/webapi/xml/1.0/';
        return true;
      } else {
        return false;
      }
    };

    var connectGracenoteMetaDataAndSong = function(songId, backendId, metaData) {
      self.db.query.merge({
        mergeId: (songId + '_' + backendId),
        songId: songId,
        backendId: backendId,
        genre: metaData.genre,
        mood: metaData.mood,
        tempo: metaData.tempo
      }, 'mergeId');
    };

    var extractGenreMood = function(xml) {
      return {
        genre: xml.find('GENRE').text(),
        mood: xml.find('MOOD').text(),
        tempo: xml.find('TEMPO').text(),
        matched: (xml.find('MATCHED_TRACK_NUM').length > 0)
      };
    };

    var extractMoodInformations = function(songId, backendId, resp) {
      var xml = parse(resp);
      var metaData = null;
      if (null !== xml) {
        metaData = extractGenreMood(xml);
        if (metaData.matched) {
          connectGracenoteMetaDataAndSong(songId, backendId, metaData);
        }
      }
    };

    function requestMetaDataForSong(songId, backendId, data) {
      req(data).success(function(resp) {
        extractMoodInformations(songId, backendId, resp);
      });
    }

    this.collectBasicInformations = function(unmatchedElems, firstResult, maxResults) {
      var i = 0,
        length = unmatchedElems.length;
      for (i; i < length; i++) {
        var arr = unmatchedElems[i];
        var data = moodSimpleQuery.replace('{{webAPI_ID}}', webApiId).replace('{{user_ID}}', userId)
          .replace('{{artist}}', arr.artist).replace('{{album}}', arr.album).replace('{{title}}', arr.title);
        requestMetaDataForSong(arr.songId, arr.backendId, data);
      }
      setTimeout(function() {
        findUntrackedSongs((firstResult + maxResults), maxResults, self.collectBasicInformations);
      }, 3000);
    };

    var findUntrackedSongs = function(firstResult, maxResults, untrackedSongsCallback) {
      // TODO use db join here to join both databases on songId and backendId to only fetch that is not already fetched
      var untrackedSongs = [];
      var songs = Audica.songDb.query().start(firstResult).limit(maxResults).select('id', 'backendId');
      for (var i = 0; i < songs.length; i++) {
        var songId = songs[i][0];
        var backendId = songs[i][1];
        var match = Audica.songDb.query({
          'id': songId,
        }, {
          'backendId': backendId
        }).select('album', 'artist', 'title')[0];
        untrackedSongs[untrackedSongs.length] = {
          album: match[0],
          artist: match[1],
          title: match[2],
          songId: songId,
          backendId: backendId
        };
      }
      untrackedSongsCallback(untrackedSongs, firstResult, maxResults);
    };

    this.collectData = function() {
      prepareUI();
      findUntrackedSongs(0, 10, self.collectBasicInformations);
    };

    this.init = function() {
      self.db.init('plugin_gracenote');
      if (getCredentials()) {
        req(authQuery.replace('{{webAPI_ID}}', webApiId)).success(function(resp) {
          var xml = parse(resp);
          userId = getSingleVal(xml, 'user');
          Audica.trigger('initReady');
        });
      } else {
        Audica.trigger('WARN', 'Gracenote disabled!');
        Audica.trigger('initReady');
      }
    };

    Audica.on('playSong', function(args) {
      var gnPreview = $('#gnPreview');
      gnPreview.hide();
      var song = args.song;
      $('#gnSuggestions').empty();
      gnPreview.show('slow');
      var currentSongMetadata = self.db.query({
        'backendId': song.backendId
      }, {
        'songId': song.id
      }).select('mood', 'tempo', 'genre');
      if (currentSongMetadata.length > 0) {
        var mood = currentSongMetadata[0][0];
        var byMood = self.db.query({
          'mood': mood
        }).get();
        var trackForSuggestion = Math.floor(Math.random() * byMood.length);
        var obj = byMood[trackForSuggestion];
        var track = Audica.songDb.query({
          'backendId': obj.backendId
        }, {
          'id': obj.songId
        }).first();
        addTrackToSuggestions(track);
      }
    });
  }

  Audica.extend('gracenote', new Gracenote());
})(window, Audica, jQuery);
