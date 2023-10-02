const fs = require("fs");
const { parse } = require("csv-parse");
const { load } = require("cheerio");
const axios = require("axios");

function csvArrayToObj(csvData) {
  return csvData
    .map((csvLine, csvIndex) => {
      if (csvIndex === 0 || !csvLine.length) return null; // skip header and empty lines
      return csvLine.reduce((a, v, i) => ({ ...a, [csvData[0][i]]: v }), {});
    })
    .filter((filter) => !!filter); //filter empty lines
}

function getCount(countString) {
  const match = countString.match(/\d+/g);
  if (match && match.length > 0) {
    const restNumbers = match.slice(1).join("");
    return parseInt(restNumbers);
  }
  return null;
}

const BASE_URL = "https://www.electrical.com";
const LOCAL_URL = "http://localhost:3000";

async function loadUrls(url, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const formatedUrl = url.replace(BASE_URL, LOCAL_URL);
        const response = await axios.get(formatedUrl);
        let $ = load(response.data);
        const title = $("h1").text();
        const count = $("div.styles__LeftContainer-sc-4iftiq-1").text();
        resolve({
          pageTitle: title,
          url: formatedUrl,
          status: title ? 200 : 404,
          count: getCount(count),
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    }, delay);
  });
}

const readdir = (dirname) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (error, filenames) => {
      if (error) {
        reject(error);
      } else {
        resolve(filenames);
      }
    });
  });
};

const filtercsvFiles = (filename) => {
  return filename.split(".")[1] === "csv";
};

const results = [];
readdir("./csv/plp").then((filenames) => {
  filenames = filenames.filter(filtercsvFiles);

  filenames &&
    filenames.length > 0 &&
    filenames.map((fileName, i) => {
      fs.createReadStream(`./csv/plp/${fileName}`)
        .pipe(parse({ delimiter: "," }))
        .on("data", function (row) {
          results.push(row);
        })
        .on("end", async function () {
          console.log("sdfasdf", results);
          const formatedArr = csvArrayToObj(results);
          const delay = 200;
          const urls = await Promise.all(
            formatedArr.map((item, i) => loadUrls(item?.loc, i * delay))
          );
          fs.writeFileSync(
            `./results/plp/urlStatus-${i}.json`,
            JSON.stringify(urls)
          );
        })
        .on("error", function (error) {
          console.log(error.message);
        });
    });
});
