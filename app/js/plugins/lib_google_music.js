/*global FormData, XMLHttpRequest, Audica, console, localStorage, chrome, window*/
(function(window, Audica) {
  "use strict";

  function GoogleMusic() {
    var backendId = 'googleMusic';
    var timestamp = null;

    function getSongStream(songid) {
      var result = null;
      var req = new XMLHttpRequest();
      req.open('GET', 'https://play.google.com/music/play?u=0&pt=e&xt=' + localStorage.googlemusic_xt_cookie + '&songid=' + songid, false);
      req.send();
      if (req.status === 200) {
        var response = JSON.parse(req.response);
        result = response.url;
      } else {
        console.log('Could not get stream to song id "' + songid + '"');
      }
      return result;
    }

    function updateSongList(args) {
      timestamp = args.timestamp;
      if (localStorage.googlemusic_xt_cookie) {
        getSongs([], '');
      } else {
        window.open('https://play.google.com/music/listen');
      }
    }

    function parseSongs(response, songList) {
      var idx = 0;
      var items = JSON.parse(response);
      var playlist = items.playlist;
      if (playlist) {
        for (idx = 0; idx < playlist.length; idx++) {
          var track = playlist[idx];
          var song = {
            "artist": track.artist,
            "album": track.album,
            "title": track.title,
            "id": track.id,
            "coverArt": track.albumArtUrl,
            "contentType": null,
            "track": track.track,
            "cd": track.disc,
            "duration": parseInt(track.durationMillis / 1000, 10),
            "genre": track.genre,
            "year": track.year,
            "addedOn": timestamp,
            "src": track.id,
            "backendId": backendId
          };
          songList.push(song);
        }
      } else {
        var success = items.success;
        if (!success) {
          var reloadXsrf = items.reloadXsrf;
          if (reloadXsrf) {
            localStorage.removeItem('googlemusic_xt_cookie');
            updateSongList({
              'timestamp': timestamp
            });
          } else {
            console.log('Error on getting track list from google music "' + items + '".');
          }
        }
      }
      return items.continuationToken;
    }

    function getSongs(songList, continuationToken) {
      var formData = new FormData();
      formData.append("json", '{"continuationToken":"' + continuationToken + '"}');
      var req = new XMLHttpRequest();
      req.open('POST', 'https://play.google.com/music/services/loadalltracks?u=0&xt=' + localStorage.googlemusic_xt_cookie, true);
      req.withCredentials = true;
      req.onload = function(event) {
        var contToken = parseSongs(event.target.response, songList);
        if (contToken) {
          getSongs(songList, contToken);
        } else {
          Audica.trigger('readyCollectingSongs', {
            songList: songList,
            backendId: backendId,
            timestamp: timestamp
          });
        }
      };
      req.send(formData);
    }

    this.getPlaySrc = function(src) {
      return getSongStream(src);
    };

    this.setCoverArt = function(src, coverArt) {
      if (src) {
        src = src.replace('=s130', '=s500');
      }
      coverArt.attr('src', 'http:' + src);
    };

    Audica.on('updateSongList', updateSongList);

    chrome.extension.onRequest.addListener(function(request, sender) {
      if (request && request.cookie) {
        var startIndex = request.cookie.indexOf('xt=') + 3;
        var endIndex = request.cookie.indexOf(";", startIndex);
        localStorage.googlemusic_xt_cookie = request.cookie.substring(startIndex, endIndex).trim();
        if (localStorage.googlemusic_xt_cookie) {
          getSongs([], '');
        } else {
          localStorage.removeItem('googlemusic_xt_cookie');
        }
      }
      chrome.tabs.remove(sender.tab.id);
    });
  }

  Audica.extend('googleMusic', new GoogleMusic());

}(window, Audica));
