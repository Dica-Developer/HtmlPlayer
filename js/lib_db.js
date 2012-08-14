//var Db = {
//
// };
//
//Db._dbName = null;
//
//Db.query = null;
//
//Db.init = function(dbName) {
//  Db._dbName = "db." + dbName;
//  var dbContent = localStorage[Db._dbName];
//  if (null !== dbContent && undefined !== dbContent) {
//    Db.query = TAFFY(JSON.parse(dbContent));
//  } else {
//    Db.query = TAFFY();
//  }
//}
//
//Db.save = function() {
//  localStorage[Db._dbName] = JSON.stringify(Db.query().get());
//}

function Db(){
  var _dbName = null;

  this.query = null;

  this.init = function(dbName) {
    _dbName = "db." + dbName;
    var dbContent = localStorage[_dbName];
    if (null !== dbContent && undefined !== dbContent) {
      this.query = TAFFY(JSON.parse(dbContent));
    } else {
      this.query = TAFFY();
    }
  };

  this.save = function() {
    localStorage[_dbName] = JSON.stringify(this.query().get());
  }
}