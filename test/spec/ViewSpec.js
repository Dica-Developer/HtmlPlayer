describe("View", function() {
  describe('Audica.View.updateMain', function(){
    beforeEach(function(){
      spyOn(Audica,'trigger');
      Audica.updateMainView('Artist','Album','Title');
    });

    it('Artist should set to "Artist"', function(){
      expect(Audica.Dom.artist).toHaveText('Artist');
    });

    it('Album should set to "Album"', function(){
      expect(Audica.Dom.album).toHaveText('Album');
    });

    it('Title should set to "Title"', function(){
      expect(Audica.Dom.title).toHaveText('Title');
    });

    it('updateMainView should be triggered', function(){
      expect(Audica.trigger).toHaveBeenCalled();
      expect(Audica.trigger).toHaveBeenCalledWith('updateMainView');
    });

  });

  describe('Audica.View.applyCoverArtStyle', function(){
    beforeEach(function(){
      Audica.applyCoverArtStyle();
    });

    it('Img dimensions should set correctly', function(){
      var correctSize = Math.floor($(document).height() * 0.6);
      expect(Audica.Dom.coverArt[0].height).toEqual(correctSize);
      expect(Audica.Dom.coverArt[0].width).toEqual(correctSize);
    });
  });

  describe('Audica.View.fillSongBox', function(){
    beforeEach(function(){
      Audica.fillSongBox(subsonicSongList);
    });

    it('Song box should contain 10 elems', function(){
      expect(Audica.Dom.songBox.find('li').length).toEqual(10);
    });

    it('Option value should song object as json', function(){
      var firstLiValue = Audica.Dom.songBox.find('li').eq(0).data('song');
      var firstSongValue = escape(JSON.stringify(subsonicSongList[0]));
      expect(firstLiValue).toEqual(firstSongValue);
    });
  });

});