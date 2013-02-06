describe("PlayerControl", function() {
  it("Audica should be initialized", function() {
    //TODO find an other way to define Audica global and once
    Audica = new AUDICA();
    Audica.on('domElementsSet', Audica.View.applyCoverArtStyle);
    Audica.songDb.init('song');
    Audica.historyDb.init('history');
    Audica.on('readyCollectingSongs', function (args) {
      Audica.collectSongs(args.songList, args.backendId, args.timestamp);
    });
    Audica.Dom.initDom();
    Audica.registerEvents();

    function MockPlugin(){
      this.setPlaySrc = function(src, player) {};

      this.setCoverArt = function(src, coverArt) {};
    }

    Audica.plugins.mockPlugin = new MockPlugin();
    Audica.collectSongs(mockSongList, 'mockPlugin', $.now());

    expect(Audica).toBeDefined();
  });

  describe('Audica.PlayerControl without plugin', function(){

    it('Audica.PlayerControl.play should trigger "onStartPlaying"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.play(subsonicSongList[0]);

      var eventObject = {song:subsonicSongList[0]};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('onStartPlayingSong', eventObject);
    });

    it('Audica.PlayerControl.play should trigger "ERROR - cannot handle song"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.play(subsonicSongList[0]);

      var eventObject = {message:'Cannot handle songs from backend subsonic.'};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('ERROR', eventObject);
    });

    it('Audica.PlayerControl.next should trigger "ERROR - empty playlist"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.next();

      var eventObject = {message:'No song found. Possible reason: Empty Playlist'};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('ERROR', eventObject);
    });

    it('Audica.PlayerControl.next should trigger "nextSong"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.next();

      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('nextSong');
    });

    it('Audica.PlayerControl.previous should trigger "ERROR - empty history"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.previous();

      var eventObject = {message:'No song found. Possible reason: Empty History'};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('ERROR', eventObject);
    });

    it('Audica.PlayerControl.previous should trigger "previousSong"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.previous();

      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('previousSong');
    });
  });

  describe('Audica.PlayerControl with plugin mock', function(){
    it('Audica.PlayerControl.play should trigger "onStartPlaying"', function(){
      spyOn(Audica,'trigger');
      Audica.PlayerControl.play(mockSongList[0]);

      var eventObject = {song:mockSongList[0]};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('onStartPlayingSong', eventObject);
    });

    it('Audica.PlayerControl.play should set src', function(){
      spyOn(Audica.plugins.mockPlugin,'setPlaySrc');
      Audica.PlayerControl.play(mockSongList[0]);

      expect(Audica.plugins.mockPlugin.setPlaySrc).toHaveBeenCalled();
      expect(Audica.plugins.mockPlugin.setPlaySrc).toHaveBeenCalledWith(mockSongList[0].src, Audica.Dom.player);
    });

    it('Audica.PlayerControl.play should set coverArt', function(){
      spyOn(Audica.plugins.mockPlugin,'setCoverArt');
      Audica.PlayerControl.play(mockSongList[0]);

      expect(Audica.plugins.mockPlugin.setCoverArt).toHaveBeenCalled();
      expect(Audica.plugins.mockPlugin.setCoverArt).toHaveBeenCalledWith(mockSongList[0].coverArt, Audica.Dom.coverArt);
    });

    it('Audica.PlayerControl.next should play song', function(){
      Audica.Dom.setFirstPlaylistElement(mockSongList[0]);
      spyOn(Audica.PlayerControl,'play');
      Audica.PlayerControl.next();

      var eventObject = {message:'No song found. Possible reason: Empty Playlist'};
      expect(Audica.PlayerControl.play).toHaveBeenCalled();
      expect(Audica.PlayerControl.play).toHaveBeenCalledWith(mockSongList[0]);
    });


    //TODO find a way to add mock play list to songDb and remove after test
    xit('Audica.PlayerControl.previous should play song', function(){
      spyOn(Audica.PlayerControl,'play');
      Audica.PlayerControl.previous();

      var eventObject = {message:'No song found. Possible reason: Empty Playlist'};
      expect(Audica.PlayerControl.play).toHaveBeenCalled();
      expect(Audica.PlayerControl.play).toHaveBeenCalledWith(mockSongList[0]);
    });

  });


});