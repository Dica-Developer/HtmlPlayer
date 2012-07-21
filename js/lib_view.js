(function ($, debug, log) {
  var closePlayerControlViewTimerId = null;
  var slideLock = false;
  var viewState = 'player';
  var searchView = null;
  var playerView = null;
  var mainWrapper = null;
  var dropZone = null;
  //file explorer
  var fileList = null;
  var rootDir = []; // holds all the element (file/dir)
  var rootUl = null;
  var busyCount = 1;
  var finishedRequestCallback = null;
  var usageDiv = null;
  var header = null;
  var emptyMessage = null;
  //file explorer
  var player = null;
  var bw = $(window).width();
  var x = '0px';

//Player Control
  var closePlayerControlView = function () {
    var elem = $("#playerControlView");
    closePlayerControlViewTimerId = null;
    elem.data("open", false);
    elem.animate({
      height:"4px"
    });
  };

  $(document).on('mousemove', function () {
    if ('player' === viewState) {
      if (null !== closePlayerControlViewTimerId) {
        clearTimeout(closePlayerControlViewTimerId);
      }
      var elem = $("#playerControlView");
      if (!elem.data("open")) {
        elem.data("open", true);
        elem.animate({
          height:"50px"
        });
      }
      closePlayerControlViewTimerId = setTimeout(closePlayerControlView, 3000);
    }
  });
//Player Control


//handle sensitive zones right & left
  function handleRightZone(event) {
    switch(event.type){
      case 'mouseenter':
        if(slideLock)return;
        switch(viewState){
          case 'search':
            x = '-'+((bw*5/100)) +'px';
            break;
          case 'player':
            x = '-'+(bw + ((bw*5/100))) +'px';
            break;
          case 'fileView':
            return;
            break;
        }
        break;
      case 'mouseleave':
        if(slideLock)return;
        switch(viewState){
          case 'search':
            x = '0px';
            break;
          case 'player':
            x = '-'+bw+'px';
            break;
          case 'fileView':
            return;
            break;
        }
        break;
      case 'click':
        switch(viewState){
          case 'search':
            var audio = document.getElementById('player');
            if (audio.paused) {
              next();
              setNowPlaying();
              notScrobbled = true;
            }
            x = '-'+bw+'px';
            viewState = 'player';
            break;
          case 'player':
            x = '-'+bw*2+'px';
            viewState = 'fileView';
            break;
          case 'fileView':
            return;
            break;
        }
        log('Switched to '+ viewState);
        slideLock = true;
        setTimeout(function(){
          slideLock = false;
        }, 1000);
        break;
    }
    mainWrapper.css('-webkit-transform', 'translate('+ x +',0px)');
  }


  function handleLeftZone(event) {
    switch(event.type){
      case 'mouseenter':
        if(slideLock)return;
        switch(viewState){
          case 'fileView':
            x = '-'+((bw*2) - ((bw*5/100))) +'px';
            break;
          case 'player':
            x = '-'+ (bw - (bw*5/100)) +'px';
            break;
          case 'search':
            return;
            break;
        }
        break;
      case 'mouseleave':
        if(slideLock)return;
        switch(viewState){
          case 'fileView':
            x = '-'+(bw*2)+'px';
            break;
          case 'player':
            x = '-'+bw+'px';
            break;
          case 'search':
            return;
            break;
        }
        break;
      case 'click':
        switch(viewState){
          case 'fileView':
            var audio = document.getElementById('player');
            if (audio.paused) {
              next();
              setNowPlaying();
              notScrobbled = true;
            }
            x ='-'+bw+'px';
            viewState = 'player';
            break;
          case 'player':
            x = '0px';
            viewState = 'search';
            break;
          case 'search':
            return;
            break;
        }
        log('Switched to '+viewState);
        slideLock = true;
        setTimeout(function(){
          slideLock = false;
        }, 1000);
        break;
    }
    mainWrapper.css('-webkit-transform', 'translate('+x+',0px)');
  }
//handle sensitive zones right & left

//file explorer
      function requestList(dir) {
        sendMessage('changeDirectory', dir + '/', null);
      }

      function command_filedir(request) {
        debug('file dir');
        var current = getDir(request.path);
        if (current.dir.length == 0) {
          emptyMessage.show();
        }else{
          emptyMessage.hide();
        }
        current.dir.push(request);
      }

      function showFileList(node, nodeul) {
        debug('Build list:');
        debug(node);
        debug(nodeul);
        // Set up the 'li' node for every entry.
        var li = $('<li title="'+node.path+'"></li>');
        var entry = $('<div class="entry '+node.type+'"></div>');
        var link = $('<span class="link">'+node.name+'</span>');
        var operation = $('<span class="operation" style="color:red;">X</span>');
        link.appendTo(entry);
        entry.appendTo(li);

        if (node.type == 'file') {
          li.addClass('listFile');
          var divR = $('<span class="size">'+bytesToSize(node.size, 2)+'</span>').appendTo(entry);
          link.data('path', node.url);
          operation.on('click', function(){FileApi.removeFile(node.name);});
          operation.appendTo(entry);
          link.on('click',function(){
            Controller.playFromExplorer($(this).data('path'));
          });
        } else {
          debug('Req type is dir: ' + node.path);
          li.addClass('listDir');
          operation.on('click', function(){FileApi.removeFolder(node.path);});
          operation.appendTo(entry);
          node.ul = $('<ul></ul>');
          node.ul.appendTo(li);
          link.on('click', function() {
            if (node.isOpened) { // CLOSING
              entry.removeClass('open');
              node.isOpened = false;
              node.ul.remove();
              node.ul = $('<ul></ul>');
              node.ul.appendTo(li);
            } else { // OPENING
              entry.addClass('open');
              node.files = [];
              node.isOpened = true;
              requestList(node.path);
            }
          });
        }
        li.appendTo(nodeul);
      }

      function command_sort(dir) {
        dir.sort(function(a, b) {
          var nameA = a.name.toLowerCase();
          var nameB = b.name.toLowerCase();
          if (a.type != b.type) {
            if (a.type == 'dir') return -1;
            else return 1;
          } else {
            if (nameA < nameB) return -1;
            else if (nameA > nameB) return 1;
            else return 0;
          }
        });
      }

      function clearFileBrowser() {
        debug('Clear file browser');
        rootDir = [];
        rootUl.empty();
        usageDiv.html('N.A.');
      }

      function deleteAll() {
        debug('Delete all requested');
        sendMessage('deleteAll', null, function(){
          clearFileBrowser();
        });
      }

      function get_unit(size) {
        var unit = 0;
        while (size > 1024 && unit < 5) {
          size /= 1024;
          unit++;
        }
        if (unit == 5) return 'unlimited';
        size = Math.floor(Math.round(size * 100) / 100);
        return size + ['', 'K', 'M', 'G', 'T'][unit] + 'B';
      }
      function bytesToSize(bytes, precision) {
        var kilobyte = 1024;
        var megabyte = kilobyte * 1024;
        var gigabyte = megabyte * 1024;
        var terabyte = gigabyte * 1024;

        if ((bytes >= 0) && (bytes < kilobyte)) {
          return bytes + ' B';

        } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
          return (bytes / kilobyte).toFixed(precision) + ' KB';

        } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
          return (bytes / megabyte).toFixed(precision) + ' MB';

        } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
          return (bytes / gigabyte).toFixed(precision) + ' GB';

        } else if (bytes >= terabyte) {
          return (bytes / terabyte).toFixed(precision) + ' TB';

        } else {
          return bytes + ' B';
        }
      }

      function busy_count_up() {
        log('count up', true);
        busyCount++;
        header.html('Processing...');
      }

      function busy_count_down() {
        log('count down', true);
        if (busyCount <= 0) {
          console.error('ERROR: busy_count_down() is called while busyCount <= 0');
          return;
        }
        busyCount--;
        if (busyCount == 0) {
          header.html('File Explorer');
          if (finishedRequestCallback) {
            finishedRequestCallback();
          }
        }
      }

      function getDir(path) {
        var splitted = path.split('/');
        var currentUl = rootUl;
        var currentDir = rootDir;
        for (var i = 1; i < splitted.length - 1; i++) {
          for (var j = 0; j < currentDir.length; j++) {
            if (splitted[i] == currentDir[j].name) {
              currentUl = currentDir[j].ul;
              currentDir = currentDir[j].files;
              break;
            }
          }
        }
//        log(currentDir+' : '+currentUl);
        return { dir: currentDir, ul: currentUl};
      }

      function sendMessage(func, param, callbackfunc) {
        log('sendMessage: ', func);
        if (busyCount != 0) {
          log('busy count is ' + busyCount + '. not sending requests.');
          return false;
        }
        busy_count_up();
        finishedRequestCallback = callbackfunc;
        FileExplorer.onMessage.notify({
          'func': func,
          'param': param
        });
        return true;
      }


//  var deleteAllElem = null;
//      deleteAllElem = document.getElementById('delete-all');
//      deleteAllElem.addEventListener('click', function() {
//        var elem = document.getElementById('delete-all-confirmation');
//        if (elem) {
//          document.getElementById('delete-all-confirmed').addEventListener(
//            'click', function() { deleteAll(); elem.classList.add('hide'); });
//          document.getElementById('delete-all-cancelled').addEventListener(
//            'click', function() { elem.classList.add('hide'); });
//          elem.classList.remove('hide');
//        }
//      });

      var onMessage = new Event();
      onMessage.subscribe(function(e, request) {
        log('onMessage: request ->  '+request.type);
        // show the size of storage use
        if (request.type == 'usage') {
          var leftSize = request.quota - request.usage;
          usageDiv.html(get_unit(leftSize));
        }
        else if (request.type == 'show') {
          var current = getDir(request.path);
          log('currentdir: ', current.dir);
          command_sort(current.dir);

          // show the contents of currentdir
          for (var i = 0; i < current.dir.length; i++)
            showFileList(current.dir[i], current.ul);
        }
        else if (request.type == 'finished') {
          busy_count_down();
        }
        else {
          command_filedir(request);
        }
        return false;
      });
  //file explorer

  function initView() {
    searchView = $('#searchView');
    playerView = $("#playerView");
    mainWrapper = $('#mainWrapper');
    dropZone = $('#dropZone');
    player = $('#player');
    mainWrapper.css('-webkit-transform', 'translate(-'+bw+'px,0px)');
    setTimeout(function(){
      mainWrapper.css('-webkit-transition','-webkit-transform 1s');
    },500);

    dropZone.height($('#dropZone').width());
    $('#fileBrowser').height($('#fileBrowser').width());

//    initFileExplorer;
    emptyMessage = $('#emptyMessage');
    fileList = $('#fileLists');
    rootUl = $('<ul id="rootUl"></ul>');
    rootUl.appendTo(fileList);
    usageDiv = $('#usageText');
    header = $('#header');
    header.html('File Explorer');
//    initFileExplorer;


    log('Views rendered', true);

    $("#rightZone").on({
      hover:handleRightZone,
      click:handleRightZone
    });

    $("#leftZone").on({
      hover:handleLeftZone,
      click:handleLeftZone
    });

    dropZone[0].addEventListener('drop', Controller.handleDrop, false);

    log('Event binding finished');
    window.onViewRendered.notify();
  }

  function updateFileList(){
    log('Update file list');
    clearFileBrowser();
    sendMessage('updateFileList');
  }

  window.onDomloaded.subscribe(function(){
    log('Init view', true);

    initView();

    FileApi.onFileSystemChanged.subscribe(function(){
      updateFileList();
    });
  });


  window.View = {
    init:initView,
    onMessage: onMessage,
    elements: {
      searchView:searchView,
      playerView:playerView,
      mainWrapper: mainWrapper,
      dropZone: dropZone,
      player: player
    }
  };
  window.viewState = viewState;
})(jQuery, window.debug, window.log);