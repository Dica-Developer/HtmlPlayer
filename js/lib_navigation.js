window.SongNavigation = function(){
  this.nextSong = function(){
    var nextSong = this.getNextSong();
    startPlay(nextSong);
  };

  this.prevSong = function(){
    var prevSong = this.getPrevSong();
    startPlay(prevSong);
  };

  this.getNextSong = function(){
    var playListEntries = _getPlaylistEntries();
    var currentSong = localStorage['nowPlaying'];
    var nextSong;
    if(currentSong === ''){
      nextSong = playListEntries.eq(0);
    }else{
      nextSong = $('#playlistBox').find('[song-id="'+currentSong+'"]').next();
      if(nextSong.length === 0){
        nextSong = playListEntries.eq(0);
      }
    }
    return nextSong.data('song');
  };

  this.getPrevSong = function(){
    var playListEntries = _getPlaylistEntries();
    var currentSong = localStorage['nowPlaying'];
    var prevSong;
    if(currentSong === ''){
      prevSong = playListEntries.eq(playListEntries.length-1);
    }else{
      prevSong = $('#playlistBox').find('[song-id="'+currentSong+'"]').prev();
      if(prevSong.length === 0){
        prevSong = playListEntries.eq(playListEntries.length-1);
      }
    }
    return prevSong.data('song');
  };

  var _getPlaylistEntries = function(){
    return $('#playlistBox').find('option');
  };

};