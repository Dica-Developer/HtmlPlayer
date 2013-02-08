describe("Dom", function () {

  beforeEach(function () {
    Audica.fillSongBox(subsonicSongList);
  });

  it('PLaylist should contain 1 elem', function () {
    Audica.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.Dom.playlistBox.find('li').length).toEqual(1);
  });

  xit('Audica.Dom.documentHeight should equal to viewport height', function () {
    var viewportHeight = $(document).height();
    expect(Audica.Dom.documentHeight).toEqual(viewportHeight);
  });

  xit('Audica.Dom.documentWidth should equal to viewport width', function () {
    var viewportWidth = $(document).width();
    expect(Audica.Dom.documentWidth).toEqual(viewportWidth);
  });
});
