/*global $:true, window:true, Audica:true, console:true, document:true*/
(function(window, document) {
  'use strict';

  $(function() {
    window.onerror = function(error, src, row) {
      window.event.preventDefault();
      console.log('Error: %s in %s row %s', error, src, row);
    };

    Audica.start();

    // TODO move this to FileImporter.init()
    // TODO add dropzone div also in FileImporter.init()
    document.querySelector('#fileImporter_dropZone').addEventListener('drop', function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      // TODO use own dropzone for type
      if (event.dataTransfer.files.length > 0) {
        Audica.plugins.fileImporter.writeFiles(event.dataTransfer.files);
      } else if (event.dataTransfer.items.length > 0) {
        Audica.plugins.radioImporter.addUrls(event.dataTransfer.items);
      } else {
        console.error('Not handled drop item!');
      }
    }, false);
  });
}(window, document));
