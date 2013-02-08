/*global FormData, XMLHttpRequest, Audica, console*/
(function (window, Audica) {
  "use strict";

  var backendId = 'googleMusic';

  var authToken = null;

  var sid = null;

  var lsid = null;

  var xt = '';

  var timestamp = null;

  function GoogleMusic() {

    function getSongStream(songid) {
      var result = null;
      var req = new XMLHttpRequest();
      req.open('GET', 'https://play.google.com/music/play?u=0&pt=e&xt=' + xt + '&songid=' + songid, false);
      req.send();
      if (req.status === 200) {
        var response = JSON.parse(req.response);
        result = response.url;
      } else {
        console.log('Could not get stream to song id "' + songid + '"');
      }
      return result;
    }

    function parseSongs(response, songList) {
      var idx = 0;
      var items = JSON.parse(response);
      var playlist = items.playlist;
      if (playlist) {
        for (idx = 0; idx < playlist.length; idx++) {
          var track = playlist[idx];
          var song = {
            "artist":track.artist,
            "album":track.album,
            "title":track.title,
            "id":track.id,
            "coverArt":track.albumArtUrl,
            "contentType":null,
            "track":track.track,
            "cd":track.disc,
            "duration":parseInt(track.durationMillis / 1000, 10),
            "genre":track.genre,
            "year":track.year,
            "addedOn":timestamp,
            "src":track.id,
            "backendId":backendId
          };
          songList.push(song);
        }
      }
      return items.continuationToken;
    }

    function getSongs(songList, continuationToken) {
      var formData = new FormData();
      formData.append("json", '{"continuationToken":"' + continuationToken + '"}');
      var req = new XMLHttpRequest();
      req.open('POST', 'https://play.google.com/music/services/loadalltracks?u=0&xt=' + xt, true);
      req.setRequestHeader('Authorization', 'GoogleLogin auth=' + authToken);
      req.onload = function (event) {
        var contToken = parseSongs(event.target.response, songList);
        if (contToken) {
          getSongs(songList, contToken);
        } else {
          Audica.trigger('readyCollectingSongs', {
            songList:songList,
            backendId:backendId,
            timestamp:timestamp
          });
        }
      };
      req.send(formData);
    }

    function getXtCookie(request) {
      console.log(request);
      console.log(request.getAllResponseHeaders());
    }

    function authenticate() {
      //'https://www.google.com/accounts/IssueAuthToken';
      //getXtCookie();
      var songList = [];
      getSongs(songList, '');
    }

    function getAuthToken(event) {
      var response = event.target.response;
      var startIndex = response.indexOf('Auth=') + 5;
      var endIndex = response.indexOf("\n", startIndex);
      authToken = response.substring(startIndex, endIndex).trim();
      startIndex = response.indexOf('SID=') + 4;
      endIndex = response.indexOf("\n", startIndex);
      sid = response.substring(startIndex, endIndex).trim();
      startIndex = response.indexOf('LSID=') + 5;
      endIndex = response.indexOf("\n", startIndex);
      lsid = response.substring(startIndex, endIndex).trim();
      // TODO check also for sid and lsid
      if (null !== authToken && undefined !== authToken) {
        authenticate();
      }
    }

    function errorLogin() {
      console.log('Error on authentication with goolge music.');
    }

    function login(userName, password) {
      var formData = new FormData();
      formData.append('service', 'sj');
      formData.append('Email', userName);
      formData.append('Passwd', password);
      var req = new XMLHttpRequest();
      req.open('POST', 'https://www.google.com/accounts/clientlogin', true);
      req.onload = getAuthToken;
      req.onerror = errorLogin;
      req.send(formData);
    }

    this.setPlaySrc = function (src, player) {
      player.src = getSongStream(src);
    };

    this.setCoverArt = function (src, coverArt) {
      if (src) {
        src = src.replace('=s130', '=s500');
      }
      coverArt.attr('src', 'http:' + src);
    };

//    this.init = function () {
      // nothing todo
//    };

    Audica.on('updateSongList', function (args) {
      timestamp = args.timestamp;
      var userName = localStorage.googlemusic_authentication_login;
      var password = localStorage.googlemusic_authentication_password;
      if (userName && password) {
        login(JSON.parse(userName), JSON.parse(password));
      }
    });
  }

  Audica.extend('googleMusic', new GoogleMusic());

})(window, Audica);
