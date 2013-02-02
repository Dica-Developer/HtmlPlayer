/*global $:true, Scrobbler:true, FileImporter:true, chrome:true, alert:true, console:true*/
(function (document) {
  "use strict";
  function saveLogin() {
    var login = document.querySelector("#loginBox").value;
    localStorage.authentication_login = JSON.stringify(login);
  }

  function savePassword() {
    var password = document.querySelector("#passwordBox").value;
    localStorage.authentication_password = JSON.stringify(password);
  }

  function saveServerUrl() {
    var serverUrl = document.querySelector("#serverUrlBox").value;
    localStorage.serverUrl = JSON.stringify(serverUrl);
  }

  var selectTab = function() {
    var currentTab = document.querySelector("li.navbar-item-selected");
    //noinspection JSUnresolvedVariable
    currentTab.classList.remove("navbar-item-selected");
    document.querySelector("#" + currentTab.id + "Page").style.display = "none";
    //noinspection JSUnresolvedVariable
    this.classList.add("navbar-item-selected");
    document.querySelector("#" + this.id + "Page").style.display = "block";
  };

  function fill() {
    var password = localStorage.authentication_password;
    if (null !== password && undefined !== password) {
      document.querySelector("#passwordBox").value = JSON.parse(password);
    }
    var login = localStorage.authentication_login;
    if (null !== login && undefined !== login) {
      document.querySelector("#loginBox").value = JSON.parse(login);
    }
    var serverUrl = localStorage.serverUrl;
    if (null !== serverUrl && undefined !== serverUrl) {
      var serverUrlClear = JSON.parse(serverUrl);
      document.querySelector("#serverUrlBox").value = serverUrlClear;
      var selection = $("#backendSelection");
      if ("https://streaming.one.ubuntu.com" === serverUrlClear) {
        selectOption(selection, "ubuntuone");
      } else {
        selectOption(selection, "subsonic");
      }
      initBackend();
    }
    var lastFmLogin = localStorage.lastfm_login;
    if (null !== lastFmLogin && undefined !== lastFmLogin) {
      document.querySelector("#lastfmUserLink").innerHTML = lastFmLogin;
      document.querySelector("#lastfmUserLink").style.display = "block";
      document.querySelector("#lastfmUserLabel").style.display = "block";
      document.querySelector("#lastfmLogoutLink").style.display = "block";
      document.querySelector("#lastfmLoginLink").style.display = "none";
    } else {
      document.querySelector("#lastfmLoginLink").style.display = "block";
      document.querySelector("#lastfmLogoutLink").style.display = "none";
      document.querySelector("#lastfmUserLink").style.display = "none";
      document.querySelector("#lastfmUserLabel").style.display = "none";
    }
    document.querySelector("#backend").onclick = selectTab;
    document.querySelector("#scrobble").onclick = selectTab;
    document.querySelector("#about").onclick = selectTab;
  }

  function initBackend() {
    var value = $('#backendSelection').find(':selected').val();
    if ("ubuntuone" === value) {
      document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "block";
      document.querySelector("#subsonicAuthParams").style.display = "none";
      document.querySelector("#fileImporterFields").style.display = "none";
    } else if ("subsonic" === value) {
      document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "none";
      document.querySelector("#subsonicAuthParams").style.display = "block";
      document.querySelector("#fileImporterFields").style.display = "none";
    } else {
      document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "none";
      document.querySelector("#subsonicAuthParams").style.display = "none";
      document.querySelector("#fileImporterFields").style.display = "block";
    }
  }

  function selectOption(selectElement, optionValue) {
    var children = selectElement.children();
    for (var i = 0; i < children.length; i++) {
      if (optionValue === children[i].value) {
        selectElement.selectedIndex = children[i].index;
      }
    }
  }

  function logoutFromLastFm() {
    delete localStorage.lastfm_sessionKey;
    delete localStorage.lastfm_login;
    document.querySelector("#lastfmUserLink").style.display = "none";
    document.querySelector("#lastfmLogoutLink").style.display = "none";
    document.querySelector("#lastfmLoginLink").style.display = "block";
    document.querySelector("#lastfmUserLabel").style.display = "none";
  }

  function lastFmLoginClick(e) {
    e.target.href = (new Scrobbler(null, null)).getTokenUrl();
  }

  function lastfmUserLink(e) {
    e.target.href = 'http://last.fm/user/' + e.target.innerHTML;
  }

  $(function () {
    fill();

    document.querySelector('#lastfmLoginLink').addEventListener('click', lastFmLoginClick);
    document.querySelector('#lastfmLogoutLink').addEventListener('click', logoutFromLastFm);
    document.querySelector('#lastfmUserLink').addEventListener('click', lastfmUserLink);
    document.querySelector('#backendSelection').addEventListener('change', initBackend);
    document.querySelector('#serverUrlBox').addEventListener('change', saveServerUrl);
    document.querySelector('#loginBox').addEventListener('change', saveLogin);
    document.querySelector('#passwordBox').addEventListener('change', savePassword);

    var fileImporter = new FileImporter();
    fileImporter.init();
    document.querySelector('#fileImporter_dropZone').addEventListener('drop', function (event) {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      fileImporter.writeFiles(event.dataTransfer.files);
    }, false);
    document.querySelector('#fileImporter_upload').addEventListener('change', function (event) {
      fileImporter.writeFiles(event.target.files);
    }, false);

    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    chrome.extension.onRequest.addListener(function (request, sender) {
      var pattLastFM = new RegExp("^chrome-extension://.+/options/authenticate_lastfm\\.html.token=(.+)$");
      var patt = new RegExp("^ubuntuone://(.+):(.+)@syncml\\.one\\.ubuntu\\.com$");
      var match;
      if (patt.test(request.url)) {
        match = patt.exec(request.url);
        document.querySelector("#loginBox").value = match[1];
        document.querySelector("#passwordBox").value = match[2];
        document.querySelector("#serverUrlBox").value = "https://one.ubuntu.com/music/api/1.0";
        saveLogin();
        savePassword();
        saveServerUrl();
      } else if (pattLastFM.test(request.url)) {
        match = pattLastFM.exec(request.url);
        (new Scrobbler(null, null)).getSession(match[1], function (data) {
          if (undefined === data.error) {
            /** @namespace data.session */
            localStorage.lastfm_sessionKey = data.session.key;
            localStorage.lastfm_login = data.session.name;
            document.querySelector("#lastfmUserLink").innerHTML = data.session.name;
            document.querySelector("#lastfmUserLink").style.display = "block";
            document.querySelector("#lastfmLogoutLink").style.display = "block";
            document.querySelector("#lastfmLoginLink").style.display = "none";
            document.querySelector("#lastfmUserLabel").style.display = "block";
          } else {
            alert("It failed to get a session key." + data.error + " - " + data.message);
          }
        }, null);
      } else {
        alert("It failed to retreive the authentication credentials. The returned url is invalid '" + request.url + "'.");
      }
      //noinspection JSUnresolvedVariable
      chrome.tabs.remove(sender.tab.id);
    });
  });
})(document);
