/*global $:true, Audica:true, Db:true, console:true, alert:true, localStorage:true */
(function (window, Audica) {
  "use strict";

  function prepareUI(){
    var gnPreview = $('<div id="gnPreview">Gracenote suggestion</div>');
    var gnSuggestionsCon = $('<div id="gnSuggestionsCon"></div>');
    var gnSuggestions = $('<div id="gnSuggestions"></div>');

    gnSuggestionsCon.on('click', function(){
      gnSuggestionsCon.animate({top: -100}, 'slow', function(){
        $(this).data('open',false);
      });
    });
    gnPreview.on('click', function(){
      if(gnSuggestionsCon.data('open')){
        gnSuggestionsCon.animate({top: -100}, 'slow', function(){
          $(this).data('open',false);
        });
      }else{
        gnSuggestionsCon.animate({top: 20}, 'slow',function(){
          $(this).data('open',true);
        });
      }
    });
    gnSuggestions.appendTo(gnSuggestionsCon);
    gnSuggestionsCon.appendTo('#playerView');
    gnPreview.appendTo('#playerView');
  }

  function addTrackToSuggestions(track){
    var gnSuggestions = $('#gnSuggestions');
    var suggestedTrack = $('<div class="suggestedTrack"><div class="info"></div><div class="cover"><img src="" /></div></div>');
    suggestedTrack.data('id', track.___id);
    suggestedTrack.find('.info').append('<div class="title">'+ track.title +'</div>');
    suggestedTrack.find('.info').append('<div class="artist"><span class="by">by</span> '+ track.artist +'</div>');
    suggestedTrack.find('.cover img').attr('src', track.coverArt);
    suggestedTrack.on('click', function(){
      var id = $(this).data('id');
      var song = Audica.songDb.query({'___id': '"' + id} + '"').get()[0];
      Audica.playSong(song);
    });
    suggestedTrack.appendTo(gnSuggestions);
    gnSuggestions.width(($('.suggestedTrack').length + 1) * 250);
  }


  function Gracenote() {
    this.db = new Db();
    var self = this;
    var url = null;
    var webAPI_ID = null;
    var user_ID = null;
//    var backendId = 'Gracenote';

    var auth_query = '<QUERIES><QUERY CMD="REGISTER"><CLIENT>{{webAPI_ID}}</CLIENT></QUERY></QUERIES>';
    var basic_query = '<QUERIES> <AUTH> <CLIENT>{{webAPI_ID}}</CLIENT> <USER>{{user_ID}}</USER> </AUTH> <LANG>eng</LANG>' +
      '<COUNTRY>usa</COUNTRY> <QUERY CMD="ALBUM_SEARCH"><MODE>SINGLE_BEST</MODE><TEXT TYPE="ARTIST">{{artist}}</TEXT>' +
      '<TEXT TYPE="ALBUM_TITLE">{{album}}</TEXT> </QUERY></QUERIES>';
    var mood_simple_query = '<QUERIES> <AUTH> <CLIENT>{{webAPI_ID}}</CLIENT> <USER>{{user_ID}}</USER> </AUTH> <LANG>eng</LANG>' +
      '<COUNTRY>usa</COUNTRY> <QUERY CMD="ALBUM_FETCH"><GN_ID>{{GN_ID}}</GN_ID>' +
      '<OPTION> <PARAMETER>SELECT_EXTENDED</PARAMETER> <VALUE>MOOD,TEMPO</VALUE> </OPTION></QUERY></QUERIES>';

    var req = function (data) {
      return new $.ajax({
        url:url,
        type:'POST',
        data:data,
        contentType:"text/xml",
        dataType:"text"
      });
    };

    var parse = function (resp) {
      var xmlObj = $($.parseXML(resp));
      if(xmlObj.find('RESPONSE').attr('STATUS') === 'ERROR') {
        xmlObj = null;
      }
      return xmlObj;
    };

    var getSingleVal = function (xml, val) {
      return xml.find(val.toUpperCase()).text();
    };

    var getCredentials = function () {
      var client_ID = JSON.parse(localStorage.gracenoteClient_ID) || null;
      webAPI_ID = JSON.parse(localStorage.gracenoteWepAPI_ID) || null;
      if (client_ID && webAPI_ID) {
        url = 'https://c' + client_ID + '.web.cddbp.net/webapi/xml/1.0/';
        return true;
      } else {
        return false;
      }
    };

    var addMoodToSongDB = function(albumMood, tracksMood){
      var albumFetch = self.db.query({'gn_id': albumMood.id}),
        i = 0, length = tracksMood.length;
      albumFetch.update({genre: albumMood.genre});
      albumFetch.update({genre_ID: albumMood.genre_ID});
      albumFetch.update({genre_NUM: albumMood.genre_NUM});
      for(i; i < length; ++i){
        var track = tracksMood[i];
        var trackFetch = self.db.query({'gn_id': track.id});
        trackFetch.update({mood: track.mood});
        trackFetch.update({mood_ID: track.mood_ID});
        trackFetch.update({tempo: track.tempo});
        trackFetch.update({tempo_ID: track.tempo_ID});
      }
    };

    var extractAlbumGenre = function (xml) {
      return {
        id: xml.find('GN_ID').eq(0).text(),
        genre_NUM:xml.find('GENRE').attr('NUM'),
        genre_ID: xml.find('GENRE').attr('ID'),
        genre: xml.find('GENRE').text()
      };
    };

    var extractTracksMood = function (xml) {
      var tracks = xml.find('TRACK'),
        ret = [], i = 0, length = tracks.length;
      for (i; i < length; ++i) {
        var track = tracks.eq(i);
        ret[ret.length] = {
          id: track.find('GN_ID').text(),
          mood: track.find('MOOD').text(),
          mood_ID: track.find('MOOD').attr('ID'),
          tempo: track.find('TEMPO').text(),
          tempo_ID: track.find('TEMPO').attr('ID')
        };
      }
      return ret;
    };

    var extractMoodInformations = function(resp){
      var xml = parse(resp);
      if(null !== xml){
        var albumMood = extractAlbumGenre(xml),
          tracksMood = extractTracksMood(xml);
        addMoodToSongDB(albumMood, tracksMood);
      }
    };

    var collectMoodInformations = function(id){
      var data = mood_simple_query.replace('{{webAPI_ID}}', webAPI_ID).replace('{{user_ID}}', user_ID)
        .replace('{{GN_ID}}', id);
      req(data).success(extractMoodInformations);
    };

    var createDbEntry = function(isAlbum, gn_id, backendId, song_id){
      if(self.db.query({'gn_id':gn_id}).count() === 0){
        self.db.query.insert({
          'gn_id':gn_id,
          'backendId': backendId,
          'song_id': song_id
        });
        if(isAlbum){
          collectMoodInformations(gn_id);
        }
      }
    };

    var extractAlbum = function (xml) {
      return {
        id:xml.find('GN_ID').eq(0).text(),
        album: xml.find('TITLE').eq(0).text(),
        artist: xml.find('ARTIST').eq(0).text()
      };
    };

    var extractTracks = function (xml) {
      var tracks = xml.find('TRACK'),
        ret = [], i = 0, length = tracks.length;
      for (i; i < length; ++i) {
        var track = tracks.eq(i),
          gn_id_track = track.find('GN_ID').text(),
          trackTitle = track.find('TITLE').text();
        ret[ret.length] = {
          id: gn_id_track,
          title: trackTitle
        };
      }
      return ret;
    };

    var addIdToSongDB = function(album, tracks){
      createDbEntry(true, album.id);
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var count = Audica.songDb.query({'album':{likenocase: album.album}},{'artist': {likenocase: album.artist}},{'title': {likenocase: track.title}}).count();
        if(count !== 0){
          var entries = Audica.songDb.query({'album':{likenocase: album.album}},{'artist': {likenocase: album.artist}},{'title': {likenocase: track.title}}).get();
          for (var j = 0; j < entries.length; j++) {
            var entry = entries[j];
            createDbEntry(false,track.id, entry.backendId, entry.id, entry.album, entry.artist);
          }
        }
      }
    };

    var extractBasicInformations = function(resp){
      var xml = parse(resp);
      if(null !== xml){
        var album = extractAlbum(xml),
          tracks = extractTracks(xml);
        addIdToSongDB(album, tracks);
      }
    };

    this.collectBasicInformations = function(unmatchedElems){
      var i = 0, length = unmatchedElems.length;
      for (i ; i < length; i++) {
        var arr = unmatchedElems[i];
        var data = basic_query.replace('{{webAPI_ID}}', webAPI_ID).replace('{{user_ID}}', user_ID)
          .replace('{{artist}}', encodeURIComponent(arr[1])).replace('{{album}}', encodeURIComponent(arr[0]));
        req(data).success(extractBasicInformations);
      }
    };

    var findUntrackedSongs = function(){
      var untrackedSongs = [];
      var trackedSongs = self.db.query({'song_id':{isUndefined:false}}).select('song_id');
      var songs = Audica.songDb.query().select('id');
      for (var i = 0; i < songs.length; i++) {
        var songID = songs[i];
        if($.inArray(songID, trackedSongs) === -1){
          var match = Audica.songDb.query({'id': songID}).select('album','artist')[0];
          untrackedSongs[untrackedSongs.length] = {
            album: match[0],
            artist: match[1]
          };
        }
      }
      var tmpDB = new Db();
      tmpDB.init('tmp');
      tmpDB.query.insert(untrackedSongs);
      var ret = tmpDB.query().distinct('album','artist');
      tmpDB.query().remove();
      return ret;
    };

    Audica.on('authReady', function(){
      prepareUI();
      var untrackedSongs = findUntrackedSongs();
      self.collectBasicInformations(untrackedSongs);
    });

    this.init = function () {
      self.db.init('plugin_gracenote');
      if(getCredentials()){
        req(auth_query.replace('{{webAPI_ID}}', webAPI_ID)).success(function(resp){
          var xml = parse(resp);
          user_ID = getSingleVal(xml, 'user');
          Audica.trigger('authReady');
          Audica.trigger('initReady');
        });
      }else{
        console.log('Gracenote disabled!');
        Audica.trigger('initReady');
      }

      $(window).on('beforeunload', function(){
        self.db.save();
      });
    };

  Audica.on('playSong', function(args){
    var gnPreview = $('#gnPreview');
    gnPreview.hide();
    var song = args.song;
    var gn_id = self.db.query({'backendId': song.backendId},{'song_id': song.id}).select('gn_id');
    if(gn_id.length !== 0){
      $('#gnSuggestions').empty();
      gnPreview.show('slow');
      var currentSongMetadata = self.db.query({'gn_id': gn_id[0]}).select('mood','tempo');
      var mood = currentSongMetadata[0][0];
      var tempo = currentSongMetadata[0][1];
      var byMood = self.db.query({'mood': mood}).get();
      for (var i = 0; i < byMood.length; i++) {
        var obj = byMood[i];
        var trackList = Audica.songDb.query({'backendId': obj.backendId}, {'id': obj.song_id}).get();
        for (var j = 0; j < trackList.length; j++) {
          var track = trackList[j];
          addTrackToSuggestions(track);
        }
      }
    }
  });

//    Audica.on('updateSongList', function (args) {
//    _receiveList(args.timestamp);
  }
  Audica.extend('gracenote', new Gracenote());
})(window, Audica);