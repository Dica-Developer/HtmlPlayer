/*global $:true, Audica:true, Db:true, console:true*/
(function (window) {
  "use strict";
  window.RadioImporter = function() {
    var db = new Db();

    var backendId = 'radio';

    this.init = function () {
      db.init('plugin.radio');
    };

    function addUrl(url) {
      if (db.query({'url':{'is':url}}).get().length === 0) {
        db.query.insert({'url':url});
      }
    }

    this.addUrls = function (urls) {
      var timestamp = $.now(),
        max = urls.length,
        i = 0;
      for (i; i < max; i++) {
        urls[i].getAsString(addUrl);
        if (i === max) {
          triggerCollectingSongs(db, timestamp, backendId);
        }
      }
    };

    function triggerCollectingSongs(db, timestamp, backendId) {
      db.save();
      var songList = [];
      var entries = db.query().get();
      for (var i = 0; i < entries.length; i++) {
        var song = {
          "artist":entries[i].url,
          "album":'',
          "title":'',
          "id":'',
          "coverArt":'',
          "contentType":'audio/mp3',
          "track":0,
          "cd":0,
          "duration":0,
          "genre":'',
          "year":1900,
          "addedOn":timestamp,
          "src":entries[i].url,
          "backendId":backendId
        };
        songList.push(song);
      }
      if (Audica) {
        Audica.trigger('readyCollectingSongs', {songList:songList, backendId:backendId, timestamp:timestamp});
      }
    }

    this.setPlaySrc = function (src, player) {
      player.src = src;
    };

    this.setCoverArt = function () {};
  };
})(window);