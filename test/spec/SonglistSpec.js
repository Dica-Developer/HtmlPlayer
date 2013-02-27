describe("Songlist", function() {

  describe('Song list key bindings if viewState === "search"', function(){
    beforeEach(function(){
      Audica.fillSongBox(subsonicSongList);
      Audica.setViewState('search');
    });

    it('Key "down" should set active to next elem', function(){
      Mousetrap.trigger('down');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(0);
      Mousetrap.trigger('down');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(1);
      Mousetrap.trigger('down');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(2);
      Mousetrap.trigger('down');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(3);
    });

    it('Key "up" should set active to prev elem', function(){
      Mousetrap.trigger('up');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(9);
      Mousetrap.trigger('up');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(8);
      Mousetrap.trigger('up');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(7);
      Mousetrap.trigger('up');
      expect(Audica.Dom.songBox.find('li.active').index()).toEqual(6);
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