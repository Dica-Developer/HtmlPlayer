/*global Audica, jQuery*/
(function(window, document, $) {
  'use strict';

  $(function() {
    document.addEventListener('deviceready', function() {
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
          Audica.trigger('ERROR', 'Not handled drop item!');
        }
      }, false);
    }, false);
  });
}(window, document, jQuery));
