var fs = require("fs");
var parse = require("csv-parse");
var express = require("express");
var app = express();

var childrenList = [];
var individualsList = [];

var normalizeSSN = ssn => {
  return ssn.replace(/[^0-9\.]+/g, "");
};

// read children csv
fs.createReadStream("./data/Þjóðskrá Börn.csv")
  .pipe(parse({ delimiter: ";", from_line: 2 }))
  .on("data", function(row) {
    let child = {
      Name: row[0],
      Ssn: normalizeSSN(row[1]),
      ParentSSN: normalizeSSN(row[2]),
      BirthDate: row[3]
    };
    childrenList.push(child);
  })
  .on("end", function() {
    console.log("Done with children csv");
  });

// read individuals csv
fs.createReadStream("./data/Þjóðskrá Einstaklingar.csv")
  .pipe(parse({ delimiter: ";", from_line: 2 }))
  .on("data", function(row) {
    let child = {
      Name: row[0],
      Ssn: normalizeSSN(row[1]),
      Address: row[2],
      Spouse: row[3],
      SpouseSSN: normalizeSSN(row[4])
    };
    individualsList.push(child);
  })
  .on("end", function() {
    console.log("Done with individuals csv");
  });

app.get("/api/individuals", function(req, res) {
  res.json(individualsList);
});

app.get("/api/children", function(req, res) {
  res.json(childrenList);
});


app.get("/", function(req, res) {
    res.json(['/api/individuals', '/api/children'])
});

/**
 * Start Express server.
 */
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 4001);
app.listen(app.get("port"), () => {
  console.log(
    "App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});
