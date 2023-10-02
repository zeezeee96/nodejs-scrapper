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

// const urlStatus = [];
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
        resolve({
          pageTitle: title,
          url: formatedUrl,
          status: title ? 200 : 404,
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    }, delay);
  });
}

const results = [];

fs.createReadStream("./csv/sitemap-categories.csv")
  .pipe(parse({ delimiter: "," }))
  .on("data", function (row) {
    results.push(row);
  })
  .on("end", async function () {
    const formatedArr = csvArrayToObj(results);
    const delay = 100;
    const urls = await Promise.all(
      formatedArr.map((item, i) => loadUrls(item.loc, i * delay))
    );
    fs.writeFileSync("./csv/results/urlStatus.json", JSON.stringify(urls));
  })
  .on("error", function (error) {
    console.log(error.message);
  });
