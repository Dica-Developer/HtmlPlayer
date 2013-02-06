/*global $:true, Audica:true, Db:true, console:true, alert:true */
(function (window) {
  "use strict";

  window.Gracenote = function() {
    var self = this;
    var db = new Db();
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
      var albumFetch = db.query({'gn_id': albumMood.id}),
        i = 0, length = tracksMood.length;
      albumFetch.update({genre: albumMood.genre});
      albumFetch.update({genre_ID: albumMood.genre_ID});
      albumFetch.update({genre_NUM: albumMood.genre_NUM});
      for(i; i < length; ++i){
        var track = tracksMood[i];
        var trackFetch = db.query({'gn_id': track.id});
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
          tracksMood = extractTracksMood(xml),
          i = 0, length = tracksMood.length;
        addMoodToSongDB(albumMood, tracksMood);
      }
    };

    var collectMoodInformations = function(id){
//      console.count(id);
      var data = mood_simple_query.replace('{{webAPI_ID}}', webAPI_ID).replace('{{user_ID}}', user_ID)
        .replace('{{GN_ID}}', id);
      req(data).success(extractMoodInformations);
    };

    var createDbEntry = function(isAlbum, id){
//      console.count(isAlbum);
      if(isAlbum){
        collectMoodInformations(id);
      }
      if(db.query({'gn_id':id}).count() === 0){
        db.query.insert({'gn_id':id});
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

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var count = Audica.songDb.query({'album':{likenocase: album.album}},{'artist': {likenocase: album.artist}},{'title': {likenocase: track.title}}).count();
        if(count !== 0){
          var entry = Audica.songDb.query({'album':{likenocase: album.album}},{'artist': {likenocase: album.artist}},{'title': {likenocase: track.title}});
          entry.update({'gn_id_album':album.id});
          entry.update({'gn_id_track':track.id});

          createDbEntry(true, album.id);
          createDbEntry(false,track.id);
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

    Audica.on('authReady', function(){
      var withoutGN = Audica.songDb.query({album:{'!is':'Unknown'}},[{gn_id_album:{isUndefined:true}},{gn_id_album:{isNull:true}}])
        .distinct('album','artist');
        self.collectBasicInformations(withoutGN);
    });

    this.init = function () {
      db.init('plugin.gracenote');
      if(getCredentials()){
        req(auth_query.replace('{{webAPI_ID}}', webAPI_ID)).success(function(resp){
          var xml = parse(resp);
          user_ID = getSingleVal(xml, 'user');
          Audica.trigger('authReady');
        });
      }else{
        console.log('Gracenote disabled!');
      }
    };

  Audica.on('playSong', function(args){
    var song = args.song;
    var gn_id_track = song.gn_id_track;
    var gn_id_album = song.gn_id_album;
    if(gn_id_track){
      var currentSongMetadata = db.query({'gn_id': gn_id_track}).get()[0];

      var mood = currentSongMetadata.mood;
      var byMood = db.query({'mood': mood}).get();
//      console.log('Suggestion from ' + byMood.length + ' mood ' + mood);
      for (var i = 0; i < byMood.length; i++) {
        var obj = byMood[i];
        var trackList = Audica.songDb.query([{'gn_id_track': obj.gn_id}, {'gn_id_album': obj.gn_id}]).get();
//        console.log('Suggest ' + trackList.length + ' tracks');

        for (var j = 0; j < trackList.length; j++) {
          var obj1 = trackList[j];
//          console.log('Suggested Track by mood: '+ obj1.title );
        }
      }
    }
  });

    Audica.on('updateSongList', function (args) {
//    _receiveList(args.timestamp);
    });

    this.tmpDB = db;
  };
})(window);

//Audica.songDb.query({gn_id_album:{isUndefined:false}}).update({gn_id_album: undefined});
//Audica.songDb.query({gn_id_album:{isUndefined:false}}).get();