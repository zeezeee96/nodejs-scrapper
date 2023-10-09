const fs = require("fs");
const { parse } = require("csv-parse");
const { load } = require("cheerio");
const axios = require("axios");
const { csvArrayToObj, readdir, filtercsvFiles } = require("./helperFuncs");
const { BASE_URL, LOCAL_URL } = require("./config");

async function loadUrls(url, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const formatedUrl = url.replace(BASE_URL, LOCAL_URL);

        axios
          .get(formatedUrl)
          .then((res) => {
            let $ = load(res.data);
            const title = $("h1").text();
            resolve({
              pageTitle: title,
              url: formatedUrl,
              status: 200,
            });
          })
          .catch((err) => {
            resolve({
              pageTitle: "Not Found",
              url: formatedUrl,
              status: err.response.status,
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
  const results = [];
  readdir("./csv/pdp").then((filenames) => {
    filenames = filenames.filter(filtercsvFiles);
    filenames &&
      filenames.length > 0 &&
      filenames.map((fileName, i) => {
        fs.createReadStream(`./csv/pdp/${fileName}`)
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

            fs.writeFileSync(
              `./results/pdp/urlStatus-${i}.json`,
              JSON.stringify(urls)
            );
          })
          .on("error", function (error) {
            console.error(error.message);
          });
      });
  });
};
