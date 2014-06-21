/*global document:true, $:true, Scrobbler:true, alert:true, chrome:true , hex_md5*/

(function(document) {
  "use strict";

  function saveLogin() {
    var login = $("#loginBox").val();
    chrome.storage.local.set({
      'authentication_login': JSON.stringify(login)
    });
  }

  function savePassword() {
    var password = $("#passwordBox").val();
    chrome.storage.local.set({
      'authentication_password': JSON.stringify(password)
    });
  }

  function saveServerUrl() {
    var serverUrl = $("#serverUrlBox").val();
    chrome.storage.local.set({
      'serverUrl': JSON.stringify(serverUrl)
    });
  }

  function selectOption(selectElement, optionValue) {
    var children = selectElement.children();
    var i = null;
    for (i = 0; i < children.length; i++) {
      if (optionValue === children[i].value) {
        selectElement.selectedIndex = children[i].index;
      }
    }
  }

  function initBackend() {
    var value = $('#backendSelection').find(':selected').val();
    var subsonicAuthParams = $("#subsonicAuthParams");
    if ("subsonic" === value) {
      subsonicAuthParams.show();
    } else {
      subsonicAuthParams.hide();
    }
  }

  function selectTab(event) {
    var currentTab = $("li.navbar-item-selected");
    currentTab.removeClass("navbar-item-selected");
    $("#" + currentTab.attr('id') + "Page").hide();
    var currentTarget = $(event.currentTarget);
    currentTarget.addClass("navbar-item-selected");
    $("#" + currentTarget.attr('id') + "Page").show();
  }

  function fill() {
    chrome.storage.local.get(['authentication_password', 'authentication_login', 'serverUrl', 'audica_lastfm_login', 'gracenoteClient_ID', 'gracenoteWepAPI_ID'], function(items) {
      if (items.hasOwnProperty('authentication_password')) {
        var password = items.authentication_password;
        if (null !== password && undefined !== password) {
          $("#passwordBox").val(JSON.parse(password));
        }
      }
      if (items.hasOwnProperty('authentication_login')) {
        var login = items.authentication_login;
        if (null !== login && undefined !== login) {
          $("#loginBox").val(JSON.parse(login));
        }
      }
      if (items.hasOwnProperty('serverUrl')) {
        var serverUrl = items.serverUrl;
        if (null !== serverUrl && undefined !== serverUrl) {
          var serverUrlClear = JSON.parse(serverUrl);
          $("#serverUrlBox").val(serverUrlClear);
          var selectElement = $("#backendSelection");
          selectOption(selectElement, "subsonic");
        }
      }
      initBackend();

      var gracenoteClient_ID = items.gracenoteClient_ID;
      var gracenoteWepAPI_ID = items.gracenoteWepAPI_ID;

      if (gracenoteWepAPI_ID) {
        $('#gracenoteWepAPI_ID').val(JSON.parse(gracenoteWepAPI_ID));
      }
      if (gracenoteClient_ID) {
        $('#gracenoteClient_ID').val(JSON.parse(gracenoteClient_ID));
      }

      var lastFmLogin = items.audica_lastfm_login;
      var lastfmUserLink = $("#lastfmUserLink");
      var lastfmUserLabel = $("#lastfmUserLabel");
      var lastLoginLink = $("#lastfmLoginLink");
      var lastfmLogoutLink = $("#lastfmLogoutLink");
      if (null !== lastFmLogin && undefined !== lastFmLogin) {
        lastfmUserLink.text(lastFmLogin);
        lastfmUserLink.show();
        lastfmUserLabel.show();
        lastfmLogoutLink.show();
        lastLoginLink.hide();
      } else {
        lastLoginLink.show();
        lastfmLogoutLink.hide();
        lastfmUserLink.hide();
        lastfmUserLabel.hide();
      }
      $("#backend, #scrobble, #gracenote, #about").on('click', selectTab);
    });
  }

  function logoutFromLastFm() {
    chrome.storage.local.remove('audica_lastfm_sessionKey');
    chrome.storage.local.remove('audica_lastfm_login');
    $("#lastfmUserLink").show();
    $("#lastfmLogoutLink").hide();
    $("#lastfmLoginLink").show();
    $("#lastfmUserLabel").hide();
  }

  function lastFmLoginClick(e) {
    // TODO if the plugin registers a option page it should add this event too
    chrome.app.window.create("options/authenticate_ask_lastfm.html?cb=" + chrome.runtime.getURL("options/authenticate_lastfm.html"), {
      "bounds": {
        "width": 1009,
        "height": 600
      }
    });
  }

  function lastfmUserLink(e) {
    e.target.href = 'http://last.fm/user/' + e.target.innerHTML;
  }

  var saveField = function() {
    var objectToSave = {};
    objectToSave[$(this).attr('id')] = JSON.stringify($(this).val());
    chrome.storage.local.set(objectToSave);
  };

  function getSession(token, successCB, errorCB) {
    var signature = hex_md5("api_keyac2f676e5b95231ac4706b3dcb5d379dmethodauth.getSessiontoken" + token + "29d73236629ddab3d9688d5378756134");
    $.ajax("http://ws.audioscrobbler.com/2.0/?format=json&method=auth.getSession&api_key=ac2f676e5b95231ac4706b3dcb5d379d&api_sig=" + signature + "&token=" + token, {
      type: "GET",
      success: successCB,
      error: errorCB
    });
  }

  $(function() {
    fill();

    $('#lastfmLoginLink').on('click', lastFmLoginClick);
    $('#lastfmLogoutLink').on('click', logoutFromLastFm);
    $('#lastfmUserLink').on('click', lastfmUserLink);
    $('#backendSelection').on('change', initBackend);
    $('#serverUrlBox').on('change', saveServerUrl);
    $('#loginBox').on('change', saveLogin);
    $('#passwordBox').on('change', savePassword);
    $('#gracenoteClient_ID, #gracenoteWepAPI_ID').on('change', saveField);

    /*
    chrome.runtime.onRequest.addListener(function (request, sender) {
      var pattLastFM = new RegExp("^chrome-extension://.+/options/authenticate_lastfm\\.html.token=(.+)$");
      var match = null;
      if (pattLastFM.test(request.url)) {
        match = pattLastFM.exec(request.url);
        getSession(match[1], function (data) {
          if (undefined === data.error) {
            chrome.storage.local.set({'audica_lastfm_sessionKey': data.session.key, 'audica_lastfm_login = ': data.session.name});
            var lastfmUserLink = $("#lastfmUserLink");
            lastfmUserLink.text(data.session.name);
            lastfmUserLink.show();
            $("#lastfmLogoutLink").show();
            $("#lastfmLoginLink").hide();
            $("#lastfmUserLabel").show();
          } else {
            alert("It failed to get a session key." + data.error + " - " + data.message);
          }
        }, null);
      } else {
        alert("It failed to retreive the authentication credentials. The returned url is invalid '" + request.url + "'.");
      }
      chrome.tabs.remove(sender.tab.id);
    });
  */
  });
}(document));
