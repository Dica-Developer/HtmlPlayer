var Db = {};

Db._dbName = null;

Db.query = null;

Db.init = function(dbName) {
  Db._dbName = "db." + dbName;
  var dbContent = localStorage[Db._dbName];
  if (null !== dbContent && undefined !== dbContent) {
    Db.query = TAFFY(JSON.parse(dbContent));
  } else {
    Db.query = TAFFY();
  }
}

Db.save = function() {
  localStorage[Db._dbName] = JSON.stringify(Db.query().get());
}

