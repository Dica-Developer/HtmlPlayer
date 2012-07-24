(function () {
  var googleAuth = new OAuth2('google', {
    client_id:'1063427035831-k99scrsm000891i5e5ao3fs2jh6pj0hr.apps.googleusercontent.com',
    client_secret:'iMc4u5GP41LRkQsxIfewE_jv',
    api_scope:' https://www.googleapis.com/auth/drive'
  });

  function receiveList() {
    googleAuth.authorize(function () {
      var handler = function () {
        if (this.readyState == this.DONE) {
          log('Finished receive google drive information', true);
          buildList(this.response);
        }
      };

      log('Start receive google drive information', true);
      var client = new XMLHttpRequest();
      client.onreadystatechange = handler;
      client.open("GET", 'https://www.googleapis.com/drive/v2/files');
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  function buildList(response) {
    log('Start building list', true);
    var roots = null;
    var folder = {};
    var fileList = JSON.parse(response);
    var items = fileList.items;
    for (var idx = 0, item; item = items[idx]; idx++) {
      var file = {
        id:item.id,
        title:item.title,
        parentID:item.parents[0].id,
        url:item.downloadUrl,
        size:item.fileSize,
        isFolder:false,
        children: []
      };
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        if (folder[item.id] !== undefined) {
          file.children = folder[item.id].children;
        }
        file.isFolder = true;
        folder[item.id] = file;
      }
      if (folder[item.parents[0].id] === undefined || folder[item.parents[0].id] === null) {
        folder[item.parents[0].id] = {
          children: []
        };
      }
      folder[item.parents[0].id].children.push(file);
      folder[item.parents[0].id].children.sort(gDescending.bind({'title':true}));
    }
    for (var root in folder) {
      if (!folder[root].hasOwnProperty("parentID")) {
        roots = folder[root];
      }
    }
    var req = getUserInfo();
    req.onreadystatechange = function () {
      if (this.readyState == this.DONE) {
        renderUserInfo(JSON.parse(this.response));
      }
    };
    buildHtml(roots);
    $('#googleView').show();
  }

  function buildHtml(roots) {
    if (roots === null) {
      log('No list from google drive received', false);
    } else {
      var mainDiv = $('#googleFiles');
      var ul = $('<ul></ul>');
      ul.appendTo(mainDiv);
      var li;
      for (var i = 0, children; children = roots.children[i]; i++) {
          if (children.isFolder) {
            ul.attr('folder', children.parentID);
            li = $('<li id="' + children.id + '">' + children.title + '</li>');
            li.appendTo(ul);
            if (elemExist(children.parentID)) {
              ul.appendTo('#' + children.parentID);
            }
            if (children.children.length > 0) {
              buildHtml(children);
            }
          } else {
            ul.attr('folder', children.parentID);
            var isSynced = isSynchronized(roots.children[i].id) ? 'X' : 'O';
            var sync = 'syncTool(\'' + children.url + '\',\'' + children.id + '\',\'' + children.title + '\')';
            li = $('<li id="' + children.id + '">' + children.title + ' : ' + bytesToSize(children.size, 2) + '<a href="#" onclick="' + sync + '">SYNC</a> ' + isSynced + '</li>');
            li.appendTo(ul);
            ul.appendTo('#' + children.parentID);
          }
      }
    }
  }

  function renderUserInfo(userInfo) {
    var infoDiv = $('#userInfo');
    var userName = $('<div id="userName">' + userInfo.name + '</div>');
    var totalSize = $('<div id="totalSize">Available Space: ' + bytesToSize(userInfo.quotaBytesTotal, 2) + '</div>');
    var usedSize = $('<div id="usedSize">Used Space: ' + bytesToSize(userInfo.quotaBytesUsed, 2) + '</div>');
    userName.appendTo(infoDiv);
    totalSize.appendTo(infoDiv);
    usedSize.appendTo(infoDiv);
  }

  function getUserInfo() {
    var client = new XMLHttpRequest();
    googleAuth.authorize(function () {
      client.open("GET", 'https://www.googleapis.com/drive/v2/about');
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
    return client;
  }

  function Synchronize(downloadUrl, gID, title) {
    googleAuth.authorize(function () {
      var handler = function () {
        if (this.readyState == this.DONE) {
          var file = this.response;
          log('End receive file', true);
          var song = {
            title:title,
            album:'bla',
            artist:'test'
          };
          file.gID = gID;
          FileApi.writeFile(file, null, song);
//        FileApi.readID3Tags(this.response);
//        FileApi.onID3readEnd.subscribe(function(event, args){
//          FileApi.createFolder([args.artist ,args.album]);
//        });
        }
      };

      log('Start receive file', true);
      var client = new XMLHttpRequest();
      client.onreadystatechange = handler;
      client.responseType = 'blob';
      client.open("GET", downloadUrl);
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  function isSynchronized(gID) {
    return $('[gid="' + gID + '"]').length > 0;
  }


  function gDescending(A, B) {
    var result = 0;
    var compareA = null, compareB = null;
    if (this.title) {
      compareA = A.title.toLowerCase();
      compareB = B.title.toLowerCase();
    } else if (this.size) {
      compareA = parseInt(A.size);
      compareB = parseInt(B.size);

    }
    if (compareA === null && compareB !== null) {
      result = 1
    } else if (compareA !== null && compareB === null) {
      result = -1;
    } else if (compareA !== null && compareB !== null) {
      if (compareA < compareB) {
        result = -1;
      } else if (compareA > compareB) {
        result = 1;
      }
    }
    return result;
  }

  function syncTool(downloadUrl, gID, title) {
    new Synchronize(downloadUrl, gID, title);
  }
  window.Google = {
    receiveList : receiveList
  };

  window.syncTool = syncTool;
})();