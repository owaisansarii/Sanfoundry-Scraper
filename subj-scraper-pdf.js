import got from "got";
import pdf from "html-pdf";
import { load } from "cheerio";
import { writeFile, readFileSync } from "fs";
var options = {
  type: "pdf",
  timeout: "1000000",
};
var ans_cnt = 0;

const URL =
  "https://www.sanfoundry.com/1000-ruby-programming-questions-answers/";
var fname = URL;
fname = fname.replace("https://www.sanfoundry.com/", " ");
fname = fname.slice(1, -1);

let final = `<html>
<head>
<style>
.hk1_style{
  background-color: rgb(199, 193, 193);
}
</style>
</head>
                <body>
				<h2 style="text-align:center">${fname}</h2>`;
let web = "";

const extractLinks = async (url) => {
  try {
    const response = await got(url);
    const html = response.body;
    const links = [];
    const $ = load(html);
    $(".sf-section a").each(function () {
      var text = $(this).text();
      var link = $(this).attr("href");
      links.push(link);
    });
    return links;
  } catch (error) {
    console.log(error);
  }
};

const mcqScrap = async (url) => {
  try {
    const response = await got(url);
    const html = response.body;
    const $ = load(html);
    $(".sf-mobile-ads").remove(); //removing ads
    $(".sf-desktop-ads").remove(); //removing ads
    var b = [];
    var ans = [];
    $(".entry-content .collapseomatic").each(function () {
      var id = $(this).attr("id");
      $(this).remove();
      if (id) {
        ans.push($("#target-" + id).html());
      }
    });
    //for storing pre tags from questions (impure mcq stuffs)
    $(".entry-content .hk1_style-wrap5").each(function () {
      if ($(this).prev("p")) {
        var check = $(this).prev();
        if (check.html().length == 0) return;
      }
      b.push($(this).html());
    });
    var done = 0;
	let be;
    //-------------------//
    $(".entry-content p").each(function () {
      var arr = $(this).html().split("<br>");

      // for questions along with some code snippets (impure mcq stuffs)
      if (arr.length == 1 || arr.length == 2) {
        if ($(this).text().length == 0) $(this).remove();

        if ($(this).next().attr("class") == "hk1_style-wrap5") {
          done++;
		  be= b.shift();
          web += "<p><b>" + $(this).html() + done + "</b></p>" + be+"jeje";
          if (done == 4) {
			let he = ans.shift();
			console.log(he);
            web += "<i>" + he + "</i>";
            done = 0;
          }
        } else return;
      }
      //---------------------------
      if (arr.length == 5) {
        web +=
          "<p><b>" + $(this).html() + "</b></p>" + "<i>" + ans.shift() + "</i>"; //options for impure mcq
      }
      if (arr.length == 6) {
        web +=
          "<p><b>" + $(this).html() + "</b></p>" + "<i>" + ans.shift() + "</i>"; //pure mcq along with options
      }
      ans_cnt++;
    });
  } catch (error) {
    console.log("error");
  }
};

(async () => {
  console.time("Took: ");
  let li = await extractLinks(URL);
  let ctr = 0;
  let write = "";
  console.time("Scraping took: ");
  for (let i = 0; i < li.length; i++) {
    console.log(li[i]);
    ctr++;
    await mcqScrap(li[i]);
  }
  console.timeEnd("Scraping took: ");
  if (ctr === li.length) {
    final += web + `</html> </body>`;
    writeFile("./saved/" + fname + ".html", final, function (err) {
      if (err) throw err;
      console.log("Saved HTML!");
      var html = readFileSync("./saved/" + fname + ".html", "utf8");
      console.log(`Total ${ans_cnt} questions scrapped`);
      console.log(`Processing PDF... 
wait till pdf is created..`);
      pdf
        .create(html, options)
        .toFile("./saved/" + fname + ".pdf", function (err, res) {
          if (err) return console.log(err);
          console.timeEnd("Took: ");
          console.log(res);
        });
    });
  }
})();
