/*global window, TAFFY, localStorage*/
(function (window) {
  "use strict";
  window.Db = function () {
    var _dbName = null;

    this.query = null;

    this.init = function (dbName) {
      _dbName = "db." + dbName;
      var dbContent = localStorage[_dbName];
      if (null !== dbContent && undefined !== dbContent) {
        this.query = TAFFY(JSON.parse(dbContent));
      } else {
        this.query = TAFFY();
      }
    };

    this.save = function () {
      localStorage[_dbName] = JSON.stringify(this.query().get());
    };
  };
})(window);