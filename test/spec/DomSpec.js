describe("Dom", function () {

  beforeEach(function () {
    Audica.fillSongBox(subsonicSongList);
  });

  it('PLaylist should contain 1 elem', function () {
    Audica.setSongAsFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.Dom.playlistBox.find('li').length).toEqual(1);
  });
});
