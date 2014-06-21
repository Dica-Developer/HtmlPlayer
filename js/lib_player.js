/*global Media, Audica*/
(function(Audica) {
  'use strict';

  function Player() {
    var _useAudioTag = true;

    var _player = null;

    this.paused = true;

    this.volume = 0;

    this.type = '';

    function onEndedCallback() {
      Audica.nextSong();
      Audica.scrobbleNowPlaying();
      Audica.setNotScrobbled(true);
    }

    function onErrorCallbackAudioTag(event) {
      var errorMsg = 'The file "' + this.src + '" cannot be played. The possible reasons is: ';
      switch (event.currentTarget.error.code) {
        case 4:
          errorMsg += 'The current media type "' + this.type + '" is not supported.';
          break;
        case 1:
          errorMsg += 'The user agent stopped fetching the media data.';
          break;
        case 2:
          errorMsg += 'A network error stopped the user agent fetching the media data.';
          break;
        case 3:
          errorMsg += 'Error on decoding the media data.';
          break;
        default:
          errorMsg += 'Unknown error with code "' + event.currentTarget.error.code + '" happened.';
      }
      window.Audica.trigger('ERROR', {
        message: errorMsg
      });
      // TODO trigger here player ended to play next song
    }

    this.getCurrentTime = function() {
      var result = 0;
      if (_useAudioTag) {
        result = _player.currentTime;
      } else {
        result = _player.getCurrentTime();
      }
      return result;
    };

    this.getDuration = function() {
      var result = 0;
      if (_useAudioTag) {
        result = _player.duration;
      } else {
        result = _player.getDuration();
      }
      return result;
    };

    this.forwardSeconds = function(seconds) {

    };

    this.rewindSeconds = function(seconds) {

    };

    this.volumeUp = function(percentage) {

    };

    this.volumeDown = function(percentage) {

    };

    this.play = function(src) {
      if (src) {
        if (_useAudioTag) {
          _player.src = src;
          _player.type = this.type;
        } else {
          if (_player !== null) {
            _player.stop();
            _player.release();
          }
          _player = new Media(src /*, callbacks*/ );
        }
      }
      _player.play();
      this.paused = false;
    };

    this.pause = function() {
      if (null !== _player) {
        _player.pause();
        this.paused = true;
      }
    };

    this.init = function() {
      if (typeof Media !== 'undefined') {
        _useAudioTag = false;
      } else {
        _useAudioTag = true;
        _player = $('<audio id="player" autoplay="false" preload="auto"></audio>')[0];
        $(_player).on('ended', onEndedCallback);
        $(_player).on('error', onErrorCallbackAudioTag);
      }
      Audica.trigger('initReady');
    };
  }

  Audica.extend('player', new Player());
}(Audica));