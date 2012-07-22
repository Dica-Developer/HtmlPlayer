(function($){
//  Event Handling
  function EventData() {
    var isPropagationStopped = false;
    var isImmediatePropagationStopped = false;
    this.stopPropagation = function () {isPropagationStopped = true;};
    this.isPropagationStopped = function () {return isPropagationStopped;};
    this.stopImmediatePropagation = function () {isImmediatePropagationStopped = true;};
    this.isImmediatePropagationStopped = function () {return isImmediatePropagationStopped;}
  }

  function Event() {
    var handlers = [];
    this.subscribe = function (fn) {handlers.push(fn);};
    this.unsubscribe = function (fn) {
      for (var i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i] === fn) {
          handlers.splice(i, 1);
        }
      }
    };
    this.notify = function (args, e, scope) {
      e = e || new EventData();
      scope = scope || this;

      var returnValue;
      for (var i = 0; i < handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++) {
        returnValue = handlers[i].call(scope, e, args);
      }

      return returnValue;
    };
  }
//  Event Handling

//  Logging and debugging
  var DEBUG = false; // set true/false enabling/disabling debugging messages
  function log(str, timeStamp) {
    var timeString = timeStamp ? 'timestamp: ' + $.now() : '';
    console.log.bind(console, 'Audica:')(str +' '+timeString );
  }
  function debug(str) {
    if (DEBUG)
      console.log.bind(console, 'Audica:')(str);
  }

//  Logging and debugging

  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }

  var onDomLoaded = new Event();
  document.addEventListener('DOMContentLoaded', function(){
    log('DOM loaded', true);
    onDomLoaded.notify();
  });

  var onViewRendered = new Event();


  var elemExist = function(id){
    return $('#'+id).length > 0;
  };

  var bytesToSize = function(bytes, precision) {
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
  };
window.log = log;
window.debug = debug;
// Events
window.Event = Event;
window.onDomloaded = onDomLoaded;
window.onViewRendered = onViewRendered;
window.toArray = toArray;
window.elemExist = elemExist;
window.bytesToSize = bytesToSize;
})(jQuery);