const fs = require("fs");
const { parse } = require("csv-parse");
const { load } = require("cheerio");
const axios = require("axios");
const { csvArrayToObj, readdir, filtercsvFiles } = require("./helperFuncs");
const { BASE_URL, LOCAL_URL } = require("./config");

function getCount(countString) {
  const match = countString.match(/\d+/g);
  if (match && match.length > 0) {
    const restNumbers = match.slice(1).join("");
    return parseInt(restNumbers);
  }
  return null;
}

async function loadUrls(url, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const formatedUrl = url.replace(BASE_URL, LOCAL_URL);
        await axios
          .get(formatedUrl)
          .then((res) => {
            let $ = load(res.data);
            const title = $("h1").text();
            const count = $("div.styles__LeftContainer-sc-4iftiq-1").text();
            resolve({
              pageTitle: title,
              url: formatedUrl,
              status: title ? 200 : 404,
              count: getCount(count),
            });
          })
          .catch((err) => {
            console.log("ere", err, formatedUrl);
            resolve({
              pageTitle: "Not Found",
              url: formatedUrl,
              status: 404,
              count: null,
            });
          });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    }, delay);
  });
}
module.exports = function plpScrapper() {
  readdir("./csv/plp").then((filenames) => {
    filenames = filenames.filter(filtercsvFiles);

    filenames &&
      filenames.length > 0 &&
      filenames.map((fileName, i) => {
        const results = [];
        fs.createReadStream(`./csv/plp/${fileName}`)
          .pipe(parse({ delimiter: "," }))
          .on("data", function (row) {
            results.push(row);
          })
          .on("end", async function () {
            const formatedArr = csvArrayToObj(results);
            const delay = 200;
            const urls = await Promise.all(
              formatedArr.map((item, i) => loadUrls(item?.loc, i * delay))
            );
            const csvFilePath = `./results/plp/plpUrlStatus${i}.csv`;
            const writableStream = fs.createWriteStream(csvFilePath);
            writableStream.write("Page Title,Url,Status, Count\n");
            urls.forEach((obj) => {
              writableStream.write(
                `${obj.pageTitle},${obj.url},${obj.status},${obj.count}\n`
              );
            });
            writableStream.end();
          })
          .on("error", function (error) {
            console.error(error.message);
          });
      });
  });
};
