describe("Player core", function() {
  var keyup = jQuery.Event("keyup");
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

    expect(Audica).toBeDefined();
  });

  it('Plugins should be empty', function(){
    expect(Audica.plugins).toEqual({});
  });

  it('Core events should be defined', function(){
    expect(Audica.eventList).toBeDefined();
    expect(Audica.eventList.domElementsSet.length).toEqual(1);
    expect(Audica.eventList.fillSongBox.length).toEqual(1);
    expect(Audica.eventList.ERROR.length).toEqual(1);
    expect(Audica.eventList.readyCollectingSongs.length).toEqual(1);
  });

  describe('Core function should be defined', function(){
    it('Audica.PlayerControl should be defined', function(){
      expect(Audica.PlayerControl.play).toBeDefined();
      expect(Audica.PlayerControl.next).toBeDefined();
    });

    it('Audica.PlayList should be defined', function(){
      expect(Audica.Playlist.getLastSong).toBeDefined();
      expect(Audica.Playlist.getFirstElement).toBeDefined();
      expect(Audica.Playlist.removeFirstElement).toBeDefined();
    });

    it('Audica.History should be defined', function(){
      expect(Audica.History.add).toBeDefined();
      expect(Audica.History.showByTime).toBeDefined();
    });

    it('Audica.View should be defined', function(){
      expect(Audica.View.applyCoverArtStyle).toBeDefined();
      expect(Audica.View.closePlayerControlView).toBeDefined();
      expect(Audica.View.fillSongBox).toBeDefined();
      expect(Audica.View.updateMain).toBeDefined();
      expect(Audica.View.updateProgress).toBeDefined();
      expect(Audica.View.updateTimings).toBeDefined();
    });

    it('Audica.Scrobbling should be defined', function(){
      expect(Audica.Scrobbling.scrobble).toBeDefined();
      expect(Audica.Scrobbling.setNowPlaying).toBeDefined();
    });

    it('Audica.Dom objects should be set', function(){
      expect(Audica.Dom.album).toBe('label');
      expect(Audica.Dom.title).toBe('label');
      expect(Audica.Dom.artist).toBe('label');
      expect(Audica.Dom.coverArt).toBe('img');
      expect(Audica.Dom.coverArtBox).toBe('div');
      expect(Audica.Dom.descriptionBox).toBe('div');
      expect(Audica.Dom.filterBox).toBe('input');
      expect(Audica.Dom.playListBox).toBe('ul');
      expect(Audica.Dom.player).toBe('audio');
      expect(Audica.Dom.playerView).toBe('div');
      expect(Audica.Dom.playerViewPreview).toBe('div');
      expect(Audica.Dom.playerControlView).toBe('div');
      expect(Audica.Dom.progress).toBe('progress');
      expect(Audica.Dom.searchView).toBe('div');
      expect(Audica.Dom.searchViewPreview).toBe('div');
      expect(Audica.Dom.songBox).toBe('ul');
      expect(Audica.Dom.timeField).toBe('label');
    });

    it('DBs should be initialized', function(){
        expect(Audica.songDb).toBeDefined();
        expect(Audica.historyDb).toBeDefined();
    });
  });

  describe('Dom events', function(){
    it('Hover on Audica.Dom.searchViewPreview', function(){
      var mouseenterEvent = spyOnEvent(Audica.Dom.searchViewPreview, 'mouseenter');
      Audica.Dom.searchViewPreview.mouseenter();
      expect('mouseenter').toHaveBeenTriggeredOn(Audica.Dom.searchViewPreview);
      expect(mouseenterEvent).toHaveBeenTriggered();


      var mouseleaveEvent = spyOnEvent(Audica.Dom.searchViewPreview, 'mouseleave');
      Audica.Dom.searchViewPreview.mouseleave();
      expect('mouseleave').toHaveBeenTriggeredOn(Audica.Dom.searchViewPreview);
      expect(mouseleaveEvent).toHaveBeenTriggered();
    });

    it('Click on Audica.Dom.searchViewPreview', function(){
      var clickEvent = spyOnEvent(Audica.Dom.searchViewPreview, 'click');
      Audica.Dom.searchViewPreview.click();
      expect('click').toHaveBeenTriggeredOn(Audica.Dom.searchViewPreview);
      expect(clickEvent).toHaveBeenTriggered();
    });

    it('Click on Audica.Dom.playerViewPreview', function(){
      var clickEvent = spyOnEvent(Audica.Dom.playerViewPreview, 'click');
      Audica.Dom.playerViewPreview.click();
      expect('click').toHaveBeenTriggeredOn(Audica.Dom.playerViewPreview);
      expect(clickEvent).toHaveBeenTriggered();
    });

    it('Mousemove on document should open player controls', function(){
      var mousemoveEvent = spyOnEvent($(document), 'mousemove');
      expect(Audica.Dom.playerControlView.data('open')).toBeFalsy();
      $(document).trigger('mousemove');
      expect('mousemove').toHaveBeenTriggeredOn($(document));
      expect(mousemoveEvent).toHaveBeenTriggered();
      expect(Audica.Dom.playerControlView.data('open')).toBeTruthy();
    });

    it('Key "p" should play previous song', function(){
      spyOn(Audica,'trigger');
      Mousetrap.trigger('p');

      var eventObject = {message:'No song found. Possible reason: Empty History'};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('ERROR', eventObject);
    });

    it('Key "n" should play next song', function(){
      spyOn(Audica,'trigger');
      Mousetrap.trigger('n');

      var eventObject = {message:'No song found. Possible reason: Empty Playlist'};
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('ERROR', eventObject);
    });

    it('Key "Space" should play/pause song', function(){
      Mousetrap.trigger('space');
      expect(Audica.Dom.player.paused).toBeFalsy();

      Mousetrap.trigger('space');
      expect(Audica.Dom.player.paused).toBeTruthy();
    });
  });

});