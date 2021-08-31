import got from "got";
import { load } from "cheerio";
import { writeFile } from "fs";
import extractMcq from "./subj.js";

const extractLinks = async (url) => {
  try {
    const response = await got(url);
    const html = response.body;
    const links = [];
    let contents = [];
    let count = 1;
    const $ = load(html);
    $(".grid-33 ul").each(function () {
      let main = $(this).prev().text();
      let content = $(this).text().trim().split("\n");
      let link = [];
      $(this)
        .children()
        .children()
        .each(function () {
          let extras = [
            "questions-answers",
            "https://www.sanfoundry.com/technical-interview-questions/",
            "https://www.sanfoundry.com/san-storage-mcqs-freshers-experienced/",
          ];
          extras.join(",");
          let l = $(this).attr("href");
          if (l && extras.some((str) => l.includes(str))) {
            link.push(l);
          }
        });

      let final_content = [];
      for (let i = 0; i < content.length; i++) {
        if (content[i].length > 0 && content[i].includes("MCQs")) {
          final_content.push({ title: content[i], link: link.shift() });
        }
      }
      if (final_content.length > 1) {
        contents.push({
          id: count++,
          Title: main,
          content: final_content,
        });
      }
    });
    $(".grid-33 a").each(function () {
      let link = $(this).attr("href");
      let title = $(this).text();
      let done = false;
      let Main;
      for (let i = 0; i < contents.length; i++) {
        if (done) break;
        if (contents[i].content.includes(title)) {
          Main = contents[i].Title;
          done = true;
        }
      }

      // console.log(found);
      if (title && title.includes("1000") && !link.includes("problems")) {
        links.push({
          Category: Main,
          Title: title,
          Link: link,
        });
      }

      // links.push(link);
    });
    return [links, contents];
  } catch (error) {
    console.log(error);
  }
};
extractLinks("https://www.sanfoundry.com/").then(async ([links, contents]) => {
  for (let i = 0; i < contents.length; i++) {
    for (let j = 0; j < contents[i].content.length; j++)
      await extractMcq(
        contents[i].content[j].link,
        contents[i].content[j].title
      );
  }
  writeFile(
    "./saved/links.json",
    JSON.stringify(links, null, 4),
    function (err) {
      if (err) throw err;
      console.log("Saved JSON!");
    }
  );
  writeFile(
    "./saved/contents.json",
    JSON.stringify(contents, null, 4),
    function (err) {
      if (err) throw err;
      console.log("Saved JSON!");
    }
  );
});
// let links = extractLinks("https://www.sanfoundry.com/");
// console.log(extractLinks("https://www.sanfoundry.com/"));
