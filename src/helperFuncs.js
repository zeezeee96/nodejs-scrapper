const fs = require("fs");

function readdir(dirname) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (error, filenames) => {
      if (error) {
        reject(error);
      } else {
        resolve(filenames);
      }
    });
  });
}

function filtercsvFiles(filename) {
  return filename.split(".")[1] === "csv";
}
function csvArrayToObj(csvData) {
  return csvData
    .map((csvLine, csvIndex) => {
      if (csvIndex === 0 || !csvLine.length) return null; // skip header and empty lines
      return csvLine.reduce((a, v, i) => ({ ...a, [csvData[0][i]]: v }), {});
    })
    .filter((filter) => !!filter); //filter empty lines
}

module.exports = {
  readdir,
  filtercsvFiles,
  csvArrayToObj,
};
