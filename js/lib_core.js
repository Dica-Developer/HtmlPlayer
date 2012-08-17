(function () {
  /**
   *
   * @constructor
   */
  function Core() {
    /**
     *
     * @type {Object|Null}
     * @private
     */
    var _song = null;
    /**
     * @type {Array<Object>}
     * @private
     */
    var _songHistory = [];
    /**
     *
     * @type {Object}
     * @private
     */
    var _options = {};
    /**
     *
     */
    this.on('ERROR', function(args){
      console.log(args.message);
    });
    this.songDb = new Db();
    /**
     *
     * @type {Object}
     */
    this.dom = {
      /**
       * @return {Array<Object<Array>>}
       */
      firstPlayListElement : function(){
        return $("#playlistBox option :first");
      },
      /**
       * @return {Element}
       */
      player : function(){
        return document.getElementById('player');
      },
      /**
       *
       * @return {Array<Object<Array>>}
       */
      songBox : function(){
        return $("#songBox");
      }
    };
    /**
     * @description Holds all player methods
     * @type {Object}
     */
    this.playerControll = {
      /**
       * @param {Object} song
       */
      play: function(song) {
        _song = song;
        Audica.trigger('onStartPlaying', {song: song});
        var audio = Audica.dom.player();
        audio.type = song.contentType;
        audio.src = song.src;
        Audica.view.updateMain(song.artist,song.album,song.title);
//        $('#coverArt').attr("src", "https://streaming.one.ubuntu.com/rest/getCoverArt.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +song.coverArt);
      },
      /**
       * @description Plays next song
       */
      next: function() {
        var song = Audica.playlist.getFirstElement();
        if (null !== song) {
          this.play(song);
          Audica.playlist.removeFirstElement();
          addToHistory(song);
          applyCoverArtStyle();
        }else{
          Audica.trigger('ERROR', {message:'No song found. Possible reason: Empty Playlist'});
        }
      },
      /**
       * @description Plays previous song
       */
      previous : function() {
        if (_songHistory.length > 0) {
          var song = _songHistory.pop();
          if (null !== song) {
            this.play(song);
            setFirstPlaylistElement(song);
            applyCoverArtStyle();
          }else{
            Audica.trigger('ERROR', {message:'No song found. Possible reason: Empty Playlist'});
          }
        }
      }
    };
    /**
     * @description Holds all playlist methods
     * @type {Object}
     */
    this.playlist = {
      /**
       * @return {String|Null}
       */
      getFirstElement : function() {
        var elements = Audica.dom.firstPlayListElement();
        if (elements.length > 0) {
          return JSON.parse(unescape(elements.val()));
        } else {
          return null;
        }
      },
      /**
       * @return {Object|Null}
       */
      getLastSong: function() {
        return _songHistory[_songHistory.length - 1] || null;
      },
      /**
       *
       */
      removeFirstElement : function() {
        Audica.dom.firstPlayListElement().detach();
      }
    };
    /**
     *
     * @type {Object}
     */
    this.view = {
      /**
       * @param {String} artist
       * @param {String} album
       * @param {String} title
       */
      updateMain : function(artist, album, title){
        $('#title').text(title);
        $('#album').text(album);
        $('#artist').text(artist);
      },
      /**
       * @param {Array <Object<String String>>}songs
       */
      fillSongBox : function(songs) {
        var options = "";
        for (var i = 0, song; song = songs[i]; i++) {
          var option = "<option ";
          option = option + "value='" + escape(JSON.stringify(song)) + "'>";
          option = option + song.artist + " / " + song.album + " / " + song.track + ". " + song.title;
          option = option + "</option>";
          options = options + option;
        }
        Audica.dom.songBox().html(options);
      }
    };
    this.collectSongs = function(songList, backendId, timestamp) {
        for (var i = 0, song; song = songList[i]; i++) {
          Audica.songDb.query.insert(song);
        }
        Audica.songDb.query({backendId:{is:backendId}, addedOn:{lt:timestamp}}).remove();
        // TODO persisting the db should be done on closing the app
        Audica.songDb.save();
        // TODO fire event to fill song box
        var currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
        Audica.view.fillSongBox(currentSongList);
      };
    /**
     *
     * @type {Function|Null}
     */
    this.scrobbler = null;
    //Private
    /**
     * @private
     * @constructor
     */
    function Db(){
      /**
       * @type {String|Null}
       * @private
       */
      var _dbName = null;

      /**
       * @type {Function|Null}
       */
      this.query = null;

      /**
       * @param {String} dbName
       */
      this.init = function(dbName) {
        _dbName = "db." + dbName;
        var dbContent = localStorage[_dbName];
        if (null !== dbContent && undefined !== dbContent) {
          this.query = TAFFY(JSON.parse(dbContent));
        } else {
          this.query = TAFFY();
        }
      };
      this.save = function() {
        localStorage[_dbName] = JSON.stringify(this.query().get());
      }
    }

    /**
     * @param sessionKey
     * @param login
     * @constructor
     */
    function Scrobbler(sessionKey, login) {
      var _serviceUrl = "http://ws.audioscrobbler.com/2.0/";
      var _apiKey = "ac2f676e5b95231ac4706b3dcb5d379d";
      var _secret = "29d73236629ddab3d9688d5378756134";
      this.sessionKey = sessionKey;
      this.login = login;
      this.getTokenUrl = function() {
        return "http://www.last.fm/api/auth/?api_key=" + _apiKey + "&cb=" + chrome.extension.getURL("options/authenticate_lastfm.html");
      };
      this.getSession = function(token, successCB, errorCB) {
        var signature = hex_md5("api_key" + _apiKey + "methodauth.getSessiontoken" + token + _secret);
        $.ajax(_serviceUrl + "?format=json&method=auth.getSession&api_key="+_apiKey+"&api_sig="+signature+"&token="+token, {type: "GET", success: successCB, error: errorCB});
      };
      this.setNowPlaying = function(artist, track, album, duration, successCB, errorCB) {
        if (this.isAuthenticated()) {
          var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.updateNowPlayingsk" + this.sessionKey + "track" + track + _secret);
          $.ajax(_serviceUrl + "?format=json&method=track.updateNowPlaying&api_key=" + _apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration, {type: "POST", success: successCB, error: errorCB});
        }
      };
      this.scrobble = function(artist, track, album, duration, playStartTime, successCB, errorCB) {
        if (this.isAuthenticated()) {
          var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.scrobblesk" + this.sessionKey + "timestamp" + playStartTime + "track" + track + _secret);
          $.ajax(this._serviceUrl + "?format=json&method=track.scrobble&api_key=" + this._apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration + "&timestamp=" + playStartTime, {type: "POST", success: successCB, error: errorCB});
        }
      };
      this.isAuthenticated = function() {
        return null !== this.sessionKey && null !== this.login && undefined !== this.sessionKey && undefined !== this.login;
      };
    };

    /**
     * TODO make private if init method is ready
     */
    this.setScrobble = function(){
//      Audica.scrobbler = new Scrobbler('bla','blubb'); // TODO remove
      if(localStorage["audica.lastfm.sessionKey"]){
        Audica.scrobbler = new Scrobbler(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"]);
      }else{
        Audica.scrobble = null;
      }
    };


    //TODO remove debug helper
    this.getOptions =function(){
      return _options;
    }
  }

  /**
   *
   * @type {Object}
   */
  Core.prototype = {
    /**
     * @description Holds all events assigned to Audica
     * @type {Object}
     */
      eventList:{},
    /**
     * @param {String} eventName
     * @param {Function} fn
     * @return {*}
     */
      on:function (eventName, fn) {
        if (!this.eventList[eventName]) this.eventList[eventName] = [];
        this.eventList[eventName].push({ context:this, callback:fn });
        return this;
      },
    /**
     * @param {String} eventName
     * @return {*}
     */
      trigger:function (eventName) {
        if (!this.eventList[eventName]) return false;
        var args = Array.prototype.slice.call(arguments, 1);
        var events = this.eventList[eventName];
        for (var i = 0, subscription; subscription = events[i]; i++) {
          //noinspection JSValidateTypes
          subscription.callback.apply(subscription.context, args);
        }
        return this;
      },
    /**
     * @param {Object} obj
     */
      applyEventTo:function (obj) {
        obj.on = this.on;
        obj.trigger = this.trigger;
        obj.eventList = {};
      }
  };

  Audica = new Core();

  //TODO define an init method which initiates db, dom objects, options, etc.
  Audica.songDb.init('Audica');
  Audica.setScrobble();
})();
