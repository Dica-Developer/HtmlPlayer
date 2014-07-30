/*global Audica, describe, it, expect, afterEach, beforeEach, sinon*/
(function () {
    'use strict';

    describe('Core', function () {

        it('Should be defined', function () {
            expect(Audica).to.not.be.an('undefined');
        });

        describe('Databases', function () {

            it('Should be correct setup', function () {
                expect(Audica.songDb).to.not.be.an('undefined');
                expect(Audica.historyDb).to.not.be.an('undefined');

                expect(Audica.songDb).to.be.an.instanceOf(window.Db);
                expect(Audica.historyDb).to.be.an.instanceOf(window.Db);
            });

            it('Should not initialized yet', function () {
                expect(Audica.songDb.query).to.be.a('null');
                expect(Audica.historyDb.query).to.be.a('null');
            });

        });

        describe('Audica.playSong', function () {

            describe('error handling', function () {
                afterEach(function () {
                    Audica.eventList = [];
                });

                it('Should trigger "ERROR" if no song is given', function (done) {
                    Audica.on('ERROR', function testErrorCallback(error) {
                        expect(error).not.to.be.an('undefined');
                        expect(error.message).to.equal('Song is undefined');
                        done();
                    });

                    Audica.playSong();
                });

                it('Should trigger "ERROR" if Audica has no backend plugin matching song backend', function (done) {
                    Audica.on('ERROR', function testErrorCallback(error) {
                        expect(error).not.to.be.an('undefined');
                        expect(error.message).to.equal('Cannot handle songs from backend NotExisting.');
                        done();
                    });

                    Audica.playSong({backendId: 'NotExisting', contentType: 'audio/mp3'});
                });
            });

            describe('Actual play song', function () {

                var testBackEnd, playSpy;
                beforeEach(function () {
                    testBackEnd = {
                        getPlaySrc: sinon.spy(),
                        setCoverArt: sinon.spy()
                    };

                    Audica.plugins.testBackend = testBackEnd;
                    playSpy = sinon.stub(Audica.plugins.player, 'play');
                });

                afterEach(function () {
                    delete Audica.plugins.testBackend;
                    Audica.eventList = [];
                    playSpy.restore();
                });

                it('Should call backend "getPlaySrc" and "setCoverArt"', function () {
                    Audica.playSong({backendId: 'testBackend', contentType: 'audio/mp3'});
                    expect(testBackEnd.getPlaySrc.callCount).to.equal(1);
                    expect(testBackEnd.setCoverArt.callCount).to.equal(1);
                });

                it('Should call player plugin "play"', function () {
                    Audica.playSong({backendId: 'testBackend', contentType: 'audio/mp3'});
                    expect(playSpy.callCount).to.equal(1);
                });

                it('Should trigger "playSong"', function (done) {
                    Audica.on('playSong', function(eventData){
                        expect(eventData).not.to.be.an('undefined');
                        expect(eventData.song).not.to.be.an('undefined');
                        done();
                    });
                    Audica.playSong({backendId: 'testBackend', contentType: 'audio/mp3'});
                });
            });

        });

        describe('Audica.nextSong', function () {

            describe('error handling', function () {
                var testBackEnd, playSpy, getFirstPlaylistElementSpy;
                beforeEach(function () {
                    testBackEnd = {
                        getPlaySrc: sinon.spy(),
                        setCoverArt: sinon.spy()
                    };

                    Audica.plugins.testBackend = testBackEnd;
                    playSpy = sinon.stub(Audica.plugins.player, 'play');
                });

                afterEach(function () {
                    delete Audica.plugins.testBackend;
                    Audica.eventList = [];
                    playSpy.restore();
                });

                it('Should trigger "ERROR" if no song is given', function (done) {
                    getFirstPlaylistElementSpy = sinon.stub(Audica.view, 'getFirstPlaylistElement', function(){
                        return null;
                    });
                    Audica.on('ERROR', function testErrorCallback(error) {
                        expect(error).not.to.be.an('undefined');
                        expect(error.message).to.equal('No song found. Possible reason: Empty Playlist');
                        getFirstPlaylistElementSpy.restore();
                        done();
                    });

                    Audica.nextSong();
                });
            });

            describe('actual next song', function () {
                var testBackEnd,
                    playSpy,
                    historyAddSpy,
                    getFirstPlaylistElementSpy,
                    removeFirstPlaylistElementSpy;

                beforeEach(function () {
                    testBackEnd = {
                        getPlaySrc: sinon.spy(),
                        setCoverArt: sinon.spy()
                    };

                    Audica.plugins.testBackend = testBackEnd;
                    playSpy = sinon.stub(Audica, 'playSong');
                    historyAddSpy = sinon.stub(Audica, 'historyAdd');

                    getFirstPlaylistElementSpy = sinon.stub(Audica.view, 'getFirstPlaylistElement', function(){
                        return {};
                    });

                    removeFirstPlaylistElementSpy = sinon.stub(Audica.view, 'removeFirstPlaylistElement');
                });

                afterEach(function () {
                    delete Audica.plugins.testBackend;
                    Audica.eventList = [];
                    playSpy.restore();
                    getFirstPlaylistElementSpy.restore();
                    removeFirstPlaylistElementSpy.restore();
                    historyAddSpy.restore();
                });

                it('Should call "playSong", "view.removeFirstPlaylistElement" and "historyAdd"', function () {
                    Audica.nextSong();

                    expect(playSpy.callCount).to.equal(1);
                    expect(removeFirstPlaylistElementSpy.callCount).to.equal(1);
                    expect(historyAddSpy.callCount).to.equal(1);
                });

                it('Should trigger "nextSong"', function (done) {
                    Audica.on('nextSong', function(){
                        done();
                    });

                    Audica.nextSong();
                });
            });

        });

    });
}());
