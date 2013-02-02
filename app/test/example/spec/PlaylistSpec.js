describe("Playlist", function() {
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

  it('Audica.Playlist.getFirstElement should return null', function(){
    expect(Audica.Playlist.getFirstElement()).toBeNull();
  });

  it('Audica.Playlist.getFirstElement should return song object', function(){
    Audica.Dom.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.Playlist.getFirstElement()).toEqual(subsonicSongList[0]);
    Audica.Playlist.removeFirstElement();
  });

  it('Audica.Dom.removeFirstElement', function(){
    Audica.Dom.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.Playlist.getFirstElement()).toEqual(subsonicSongList[0]);
    Audica.Playlist.removeFirstElement();
    expect(Audica.Playlist.getFirstElement()).toBeNull();
  });

});