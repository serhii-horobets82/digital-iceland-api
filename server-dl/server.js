var fs = require("fs");
var parse = require("csv-parse");
var express = require("express");
var moment = require("moment");
var app = express();

var incomesList = [];
var estimatedBirthDatesList = [];

var normalizeSSN = ssn => {
  return ssn.replace(/[^0-9\.]+/g, "");
};

// read maternity leave income  csv
fs.createReadStream("./data/Vinnumálastofnun Fæðingaorlof tekjur.csv")
  .pipe(parse({ delimiter: ";", from_line: 2 }))
  .on("data", function(row) {
    let income = {
      Ssn: normalizeSSN(row[0]),
      PersonalTaxDiscount: row[1],
      MonthIncome: row[2],
      OtherMonthIncome: row[3],
      PensionSavings: row[4]
    };
    incomesList.push(income);
  })
  .on("end", function() {
    console.log("Done with maternity leave income csv");
  });

// read estimated birth dates
fs.createReadStream("./data/Vinnumálastofnun áætlaður fæðingadagur.csv")
  .pipe(parse({ delimiter: ";", from_line: 2 }))
  .on("data", function(row) {
    let estimatedBirthDate = {
      ParentSsn: normalizeSSN(row[0]),
      EstimatedBirthDate: moment(row[1], "DD.MM.YYYY").format("DD.MM.YYYY")
    };
    estimatedBirthDatesList.push(estimatedBirthDate);
  })
  .on("end", function() {
    console.log("Done with estimated birth dates csv");
  });

app.get("/api/incomes", function(req, res) {
  res.json(incomesList);
});

app.get("/api/estimatedBirthDates", function(req, res) {
  res.json(estimatedBirthDatesList);
});

app.get("/", function(req, res) {
  res.json(["/api/incomes", "/api/estimatedBirthDates"]);
});

/**
 * Start Express server.
 */
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 4002);
app.listen(app.get("port"), () => {
  console.log(
    "App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});
