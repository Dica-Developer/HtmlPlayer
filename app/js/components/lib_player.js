/*global Media, Audica*/
(function (Audica, $) {
    'use strict';

    function PluginPlayerError(message) {
        this.message = (message || '');
    }
    PluginPlayerError.prototype = new Error();

    function Player() {
        var _useAudioTag = true;

        var _player = null;

        var _volume = 1.0;

        var _self = this;

        this.paused = true;

        this.type = '';

        function onEndedCallback() {
            Audica.nextSong();
            Audica.trigger('scrobble');
        }

        function onErrorCallbackAudioTag(event) {
            var errorMsg = 'The file "' + _player.src + '" cannot be played. The possible reasons is: ';
            switch (event.currentTarget.error.code) {
                case 4:
                    errorMsg += 'The current media type "' + _player.type + '" is not supported.';
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
            Audica.trigger('ERROR', new PluginPlayerError(errorMsg));
            // TODO trigger here player ended to play next song
        }

        function onSuccessCallbackMedia() {

        }

        function onPlayingCallback() {
            _self.paused = false;
        }

        function onPauseCallback() {
            _self.paused = true;
        }

        function onErrorCallbackMedia(error) {
            Audica.trigger('ERROR', new PluginPlayerError('cordova media error code: ' + error.code));
            // TODO trigger here player ended to play next song
        }

        function onStatusChangeCallbackMedia(status) {
            _self.paused = Media.MEDIA_RUNNING !== status;

            if (Media.MEDIA_STOPPED === status) {
                onEndedCallback();
            }
        }

        this.getCurrentTime = function () {
            var result = 0;
            if (_useAudioTag) {
                result = _player.currentTime;
            } else {
                _player.getCurrentPosition(function () {
                });
                result = _player._position;
            }
            return result;
        };

        this.getDuration = function () {
            var result = 0;
            if (_useAudioTag) {
                result = _player.duration;
            } else {
                result = _player.getDuration();
            }
            return result;
        };

        this.forwardSeconds = function (seconds) {
            if (_useAudioTag) {
                _player.currentTime = _player.currentTime + seconds;
            } else {
                _player.seekTo((this.getCurrentTime() + seconds) * 1000);
            }
        };

        this.rewindSeconds = function (seconds) {
            if (_useAudioTag) {
                _player.currentTime = _player.currentTime - seconds;
            } else {
                _player.seekTo((this.getCurrentTime() - seconds) * 1000);
            }
        };

        this.volumeUp = function (percentage) {
            if (_useAudioTag) {
                var currentVolume = _player.volume;
                _volume = Math.min(currentVolume + percentage, 1.0);
                _player.volume = _volume;
            } else {
                _volume = Math.min(_volume + percentage, 1.0);
                _player.setVolume(_volume);
            }
        };

        this.volumeDown = function (percentage) {
            if (_useAudioTag) {
                var currentVolume = _player.volume;
                _volume = Math.max(currentVolume - percentage, 0);
                _player.volume = _volume;
            } else {
                _volume = Math.max(_volume - percentage, 0);
                _player.setVolume(_volume);
            }
        };

        this.play = function (src) {
            if (src) {
                if (_useAudioTag) {
                    _player.src = src;
                    _player.type = this.type;
                } else {
                    if (_player !== null) {
                        if (!this.paused) {
                            _player.stop();
                        }
                        _player.release();
                    }
                    _player = new Media(src, onSuccessCallbackMedia, onErrorCallbackMedia, onStatusChangeCallbackMedia);
                    _player.setVolume(_volume);
                }
            }
            _player.play();
        };

        this.pause = function () {
            if (null !== _player) {
                _player.pause();
            }
        };

        this.init = function () {
            if (typeof Media !== 'undefined') {
                _useAudioTag = false;
            } else {
                _useAudioTag = true;
                _player = $('<audio id="player" autoplay="false" preload="auto"></audio>')[0];
                $(_player).on('ended', onEndedCallback);
                $(_player).on('error', onErrorCallbackAudioTag);
                $(_player).on('playing', onPlayingCallback);
                $(_player).on('pause', onPauseCallback);
            }
            Audica.trigger('initReady');
        };
    }


    Audica.extend('player', new Player());
}(Audica, jQuery));
