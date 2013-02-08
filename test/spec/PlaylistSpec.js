describe("Playlist", function() {
  it('Audica.Playlist.getFirstElement should return null', function(){
    expect(Audica.getFirstPlaylistElement()).toBeNull();
  });

  it('Audica.Playlist.getFirstElement should return song object', function(){
    Audica.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.getFirstPlaylistElement()).toEqual(subsonicSongList[0]);
    Audica.removeFirstPlaylistElement();
  });

  it('Audica.Dom.removeFirstElement', function(){
    Audica.setFirstPlaylistElement(subsonicSongList[0]);
    expect(Audica.getFirstPlaylistElement()).toEqual(subsonicSongList[0]);
    Audica.removeFirstPlaylistElement();
    expect(Audica.getFirstPlaylistElement()).toBeNull();
  });

});