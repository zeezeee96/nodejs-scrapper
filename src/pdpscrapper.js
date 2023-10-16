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
            const description = !!$(
              "p.style__ProudctInfoParagraph-sc-d7ned9-1"
            ).text();
            const specs = !!$(
              "div.style__ProductSpecSection-sc-hdkby1-2"
            ).text();
            const cartEnabled =
              $("button.style__CartButton-sc-nxiv7t-27").text() ===
              "ADD to CART"
                ? true
                : false;
            resolve({
              pageTitle: title,
              url: formatedUrl,
              status: 200,
              description,
              specs,
              cartEnabled,
            });
          })
          .catch((err) => {
            resolve({
              pageTitle: "Not Found",
              url: formatedUrl,
              status: err.response.status,
              description: false,
              specs: false,
              cartEnabled: false,
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
  readdir("./csv/pdp").then((filenames) => {
    filenames = filenames.filter(filtercsvFiles);
    filenames &&
      filenames.length > 0 &&
      filenames.map((fileName, i) => {
        const results = [];
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

            const csvFilePath = `./results/pdp/pdpUrlStatus${i}.csv`;
            const writableStream = fs.createWriteStream(csvFilePath);
            writableStream.write(
              "Page Title,Url,Status,Description, Specs, CartEnabled \n"
            );
            urls.forEach((obj) => {
              writableStream.write(
                `${obj.pageTitle},${obj.url},${obj.status},${obj.description},${obj.specs},${obj.cartEnabled}\n`
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
