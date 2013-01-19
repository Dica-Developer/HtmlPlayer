describe("Dom", function() {
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

  beforeEach(function(){
    Audica.View.fillSongBox(subsonicSongList);
  });

  it('PLaylist should contain 1 elem', function(){
    Audica.Dom.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.Dom.playListBox.find('li').length).toEqual(1);
  });

  it('Audica.Dom.documentHeight should equal to viewport height', function(){
    var viewportHeight = $(document).height();
    expect(Audica.Dom.documentHeight).toEqual(viewportHeight);
  });

  it('Audica.Dom.documentWidth should equal to viewport width', function(){
    var viewportWidth = $(document).width();
    expect(Audica.Dom.documentWidth).toEqual(viewportWidth);
  });
});