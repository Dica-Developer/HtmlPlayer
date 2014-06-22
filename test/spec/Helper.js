beforeEach(function () {
    jasmine.getFixtures().fixturesPath = 'base/test/fixtures';
    jasmine.getJSONFixtures().fixturesPath = 'base/test/fixtures';
    loadFixtures('coreDom.html');

    subsonicSongList = getJSONFixture('songList.json');
    mockSongList = getJSONFixture('mockSonglist.json');
    chrome = {
        storage: {
            local: {
                get: function (dbName, cb) {
                    cb([]);
                }
            }
        },
        runtime: {
            onSuspend: {
                addListener: function () {
                }
            }
        }

    };
    if (!Audica.eventList.domElementsSet) {
        Audica.start();
    }
});

afterEach(function () {
    Audica.clearPlaylist();
    Audica.songHistory = [];
    Audica.Dom.songBox.empty();
});
