describe("Songlist", function() {

  describe('Song list key bindings if viewState === "search"', function(){
    beforeEach(function(){
      Audica.fillSongBox(subsonicSongList);
      Audica.setViewState('search');
    });

    it('Key "down" should set active to next elem', function(){
      Mousetrap.trigger('down');
      expect(0).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('down');
      expect(1).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('down');
      expect(2).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('down');
      expect(3).toEqual(Audica.Dom.songBox.find('li.active').index());
    });

    it('Key "up" should set active to prev elem', function(){
      Mousetrap.trigger('up');
      expect(9).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('up');
      expect(8).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('up');
      expect(7).toEqual(Audica.Dom.songBox.find('li.active').index());
      Mousetrap.trigger('up');
      expect(6).toEqual(Audica.Dom.songBox.find('li.active').index());
    });
  });

  describe('Song list key bindings if viewState !== "search"', function(){
    beforeEach(function(){
      Audica.fillSongBox(subsonicSongList);
      Audica.setViewState('playList');
    });

    it('Key "down" should not work', function(){
      Mousetrap.trigger('down');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(-1);
    });

    it('Key "up" should not work', function(){
      Mousetrap.trigger('up');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(-1);
    });
  });


});