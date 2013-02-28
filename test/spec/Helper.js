beforeEach(function() {
  jasmine.getFixtures().fixturesPath = 'fixtures';
  jasmine.getJSONFixtures().fixturesPath = 'fixtures';
  loadFixtures('coreDom.html');

  subsonicSongList = getJSONFixture('songList.json');
  mockSongList = getJSONFixture('mockSonglist.json');
  if (!Audica.eventList.domElementsSet){
    Audica.start();
  }
});

afterEach(function(){
  Audica.clearPlaylist();
  Audica.songHistory = [];
  Audica.Dom.songBox.empty();
});
