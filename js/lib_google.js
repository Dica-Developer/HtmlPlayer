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
    var fileList = JSON.parse(response);
    var items = fileList.items;
    var folder = {};
    for (var idx = 0, item; item = items[idx]; idx++) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        if (typeof folder[item.id] == 'undefined') {
          folder[item.id] = {};
        }
        folder[item.id].title = item.title;
        folder[item.id].isFolder = true;
        folder[item.id].parentID = item.parents[0].id;
        folder[item.id].id = item.id;
      } else {
        var file = {
          id:item.id,
          title:item.title,
          parentID:item.parents[0].id,
          url:item.downloadUrl,
          size:item.fileSize,
          isFolder:false
        };
        if (typeof folder[item.parents[0].id] == 'undefined') {
          folder[item.parents[0].id] = {children:[]};
        } else if (typeof folder[item.parents[0].id].children == 'undefined') {
          folder[item.parents[0].id].children = [];
        }
        folder[item.parents[0].id].children.push(file);
        folder[item.parents[0].id].children.sort(gDescending.bind({'title':true}));
      }
    }
    var roots = {};
    for (var root in folder) {
      if (folder.hasOwnProperty(root)) {
        if (typeof folder[root].children == 'undefined') {
          roots[root] = folder[root];
          roots[root].children = [];
        }
      }
    }
    for (var entry in folder) {
      if (folder.hasOwnProperty(entry)) {
        if (typeof roots[folder[entry].parentID] !== 'undefined') {
          if (roots[folder[entry].parentID].children == 'undefined') roots[folder[entry].parentID].children = [];
          roots[folder[entry].parentID].children.push(folder[entry]);
        }
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
    if (typeof roots === 'undefined' || roots.length === 0) {
      log('No list from google drive received', false);
    } else {
      var mainDiv = $('#googleFiles');
      var ul = $('<ul></ul>');
      var li;
      for (var entry in roots) {
        if (roots.hasOwnProperty(entry)) {
          if (roots[entry].isFolder) {
            ul.attr('folder', roots[entry].parentID);
            li = $('<li id="' + roots[entry].id + '">' + roots[entry].title + '</li>');
            li.appendTo(ul);
            if (elemExist(roots[entry].parentID)) {
              ul.appendTo('#' + roots[entry].parentID);
            } else {
              ul.appendTo(mainDiv);
            }
            if (typeof roots[entry].children !== undefined) {
              buildHtml(roots[entry].children);
            }
          } else {
            ul.attr('folder', roots[entry].parentID);
            var isSynced = isSynchronized(roots[entry].id) ? 'X' : 'O';
            var sync = 'syncTool(\'' + roots[entry].url + '\',\'' + roots[entry].id + '\',\'' + roots[entry].title + '\')';
            li = $('<li id="' + roots[entry].id + '">' + roots[entry].title + ' : ' + bytesToSize(roots[entry].size, 2) + '<a href="#" onclick="' + sync + '">SYNC</a> ' + isSynced + '</li>');
            li.appendTo(ul);
            ul.appendTo('#' + roots[entry].parentID);
          }
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