(function () {
  function Song(title, album, artist, url) {
    this.title = title;
    this.album = album;
    this.artist = artist;
    this.url = url;
  }

  function descending(songA, songB) {
    var result = 0;
    if (songA.artist === null && songB.artist !== null) {
      result = 1
    } else if (songA.artist !== null && songB.artist === null) {
      result = -1;
    } else if (songA.artist !== null && songB.artist !== null) {
      if (songA.artist.toLowerCase() < songB.artist.toLowerCase()) {
        result = -1;
      } else if (songA.artist.toLowerCase() > songB.artist.toLowerCase()) {
        result = 1;
      }
    }

    if (0 === result) {
      if (songA.album === null && songB.album !== null) {
        result = 1
      } else if (songA.album !== null && songB.album === null) {
        result = -1;
      } else if (songA.album !== null && songB.album !== null) {
        if (songA.album.toLowerCase() < songB.album.toLowerCase()) {
          result = -1;
        } else if (songA.album.toLowerCase() > songB.album.toLowerCase()) {
          result = 1;
        }
      } 
      if (0 === result) {
        if (songA.track === null && songB.track !== null) {
          result = 1
        } else if (songA.track !== null && songB.track === null) {
          result = -1;
        } else if (songA.track !== null && songB.track !== null) {
          if (songA.track < songB.track) {
            result = -1;
          } else if (songA.track > songB.track) {
            result = 1;
          }
        }
      }
    }
    return result;
  }

  function collectSongs(event) {
    var req = event.target;
    var ssr = req.responseXML.getElementsByTagName("subsonic-response");
    if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
      var songs = req.responseXML.getElementsByTagName("match");
      var songList = new Array();
      for (var i = 0; i < songs.length; i++) {
        var song = {
          "artist":songs[i].getAttribute("artist"),
          "album":songs[i].getAttribute("album"),
          "title":songs[i].getAttribute("title"),
          "id":songs[i].getAttribute("id"),
          "coverArt":songs[i].getAttribute("coverArt"),
          "contentType":songs[i].getAttribute("contentType"),
          "track":songs[i].getAttribute("track") ? parseInt(songs[i].getAttribute("track")) : null,
          "duration":songs[i].getAttribute("duration"),
          "genre":songs[i].getAttribute("genre"),
          "year":songs[i].getAttribute("year") ? parseInt(songs[i].getAttribute("year")) : null,
          "isFile":false
        };
        songList.push(song);
      }
      songList.sort(descending);
      localStorage["songs.list"] = JSON.stringify(songList);
      fillSongBox(songList, null);
    } else {
      error = "fetching songs failed with status '" + ssr.getAttribute("status") + "'";
    }
  }

  var localSongs = [];

  function collectLocalSongs() {
    function readFileSystem(callBack, reader) {
      reader.readEntries(function (results) {
        for (var i = 0; i < results.length; i++) {
          if (callBack)
            callBack(results[i]);
        }
      }, function (e) {
        console.log(e);
      });
    }

    function changeDirectory(dir) {
      fileSystem.root.getDirectory(
        dir,
        {create:false},
        function (entry) {
          var reader = entry.createReader();
          readFileSystem(callback, reader);
        }, function (e) {
          console.log(e);
        });
    }

    var callback = function (entry) {
      if (entry.isDirectory) {
        changeDirectory(entry.fullPath);
      } else {
        var artist = entry.fullPath.split('/')[1];
        var album = entry.fullPath.split('/')[2];
        var url = entry.toURL();
        var song = new Song(entry.name, album, artist, url);
        localSongs.push(song);
        localStorage["songs.list"] = JSON.stringify(localSongs);
        fillSongBox(localSongs, null);
      }
    };
    readFileSystem(callback, fileSystem.root.createReader());
  }

  function startPlay(song) {
    var audio = audio = document.getElementById('player');
    console.log(song);
    audio.type = 'audio/mpeg';
    audio.src = song.url;

//    $('#coverArt').attr("src", "https://streaming.one.ubuntu.com/rest/getCoverArt.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +song.coverArt);
    $('#title').text(song.title);
    $('#album').text(song.album);
    $('#artist').text(song.artist);
  }

  function playFromExplorer(path) {
    var audio = audio = document.getElementById('player');
    audio.type = 'audio/mpeg';
    audio.src = path;
  }

  function startSearch(event) {
    searchForSongs(event.target.value, collectSongs, null, null);
  }

  function getFirstPlaylistElement() {
    var elements = $("#playlistBox :first");
    if (elements.length > 0) {
      return JSON.parse(unescape(elements[0].value));
    } else {
      return null;
    }
  }

  function setFirstPlaylistElement(song) {
    var option = document.createElement("option");
    option.value = escape(JSON.stringify(song));
    var optionText = document.createTextNode(song.artist + " / " + song.album + " / " + song.track + ". " + song.title);
    option.appendChild(optionText);
    var container = document.getElementById("playlistBox");
    var elements = $("#playlistBox :first");
    if (elements.length > 0) {
      container.insertBefore(option, elements[0]);
    } else {
      container.appendChild(option)
    }
  }

  function removeFirstPlaylistElement() {
    $("#playlistBox :first").detach();
  }

  function fillSongBox(songs, query) {
    var options = "";
    for (var i = 0; i < songs.length; i++) {
      var song = songs[i];
      var patt = new RegExp(query, "i");
      if (null === query || (null != song.artist && -1 !== song.artist.search(patt)) || (null != song.title && -1 !== song.title.search(patt))
        || (null != song.album && -1 !== song.album.search(patt)) || (null != song.genre && -1 !== song.genre.search(patt))) {
        var option = "<option ";
        option = option + "value='" + escape(JSON.stringify(song)) + "'>";
        option = option + song.artist + " / " + song.album + " / " + song.track + ". " + song.title;
        option = option + "</option>";
        options = options + option;
      }
    }
    $("#songBox").html(options);
  }

  FileApi.onID3readEnd.subscribe(function (event, args) {
    FileApi.createFolder([args.artist , args.album]);
    FileApi.writeFile(args.file, null, args);
  });


  var handleDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var files = e.dataTransfer.files;
    for (var i = 0, file; file = files[i]; i += 1) {
      if (file.type === 'audio/mp3' || file.type === 'audio/mpeg') {
        FileApi.readID3Tags(file);
      }
    }
  };

  window.Controller = {
    handleDrop:handleDrop,
    getFirstPlaylistElement:getFirstPlaylistElement,
    playFromExplorer:playFromExplorer,
    collectLocalSongs:collectLocalSongs,
    fillSongBox: fillSongBox,
    collectSongs: collectSongs
  }
})();

