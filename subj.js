import got from "got";
import { load } from "cheerio";
import fs,{ writeFile, readFileSync } from "fs";
let ans_cnt = 1;
let json = [];

const extractLinks = async (url) => {
	let extras = [
		"lisp-programming-questions-answers",
		"technical-interview-questions",
		"san-storage-mcqs-freshers-experienced"
	]
	extras.join(",");
	if(extras.some(str=>url.includes(str))){
		try {
			const response = await got(url);
			const html = response.body;
			const links = [];
			const $ = load(html);
			$(".entry-content a").each( function () {
				let text = $(this).text()
				let link = $(this).attr("href");
				if(!text.includes("interview")) links.push(link);
			});
			return links;
		}catch(err){
			console.error(err);
		}
	}
	else{
		try {
			const response = await got(url);
			const html = response.body;
			const links = [];
			const $ = load(html);
			$(".sf-section a").each(function () {
				let link = $(this).attr("href");
				links.push(link);
			});
			return links;
		} catch (error) {
			console.log(error);
		}
	}
};

const mcqScrap = async (url) => {
  try {
    const response = await got(url);
    const html = response.body;
    const $ = load(html);
    $(".sf-mobile-ads").remove(); //removing ads
    $(".sf-desktop-ads").remove(); //removing ads
    let b = [];
    let ans = [];
    $(".entry-content .collapseomatic").each(function () {
      let id = $(this).attr("id");
      $(this).remove();
      if (id) {
        ans.push($("#target-" + id).text());
      }
    });
	$(".entry-content .hk1_style-wrap5").each(function () {
      if ($(this).prev("p")) {
        let check = $(this).prev();
        if (check.html().length == 0) return;
      }
      b.push($(this).html());
    });
    let done = 0;
	let answ=null;
	let q;
	let o;
    //-------------------//
    $(".entry-content p").each(function () {
		let ques=false;
      let arr = $(this).html().split("<br>");
      // for questions along with some code snippets (impure mcq stuffs)
      if (arr.length == 1 || arr.length == 2) {
        if ($(this).text().length == 0) $(this).remove();
        if ($(this).next().attr("class") == "hk1_style-wrap5") {
          done++;
		  q=$(this).text() + b.shift();
          if (done == 4) {
			answ = ans.shift();
            done = 0;
          }
        } else return;
      }
      //---------------------------
      if (arr.length === 5) {
		  let option = $(this).text();
		  option = option.trim().split("\n");
		  let answer=null;
		  if(answ){
			answer = answ;
			answ="";
		  }
		else
			answer = ans.shift()
		json.push({
			  id: ans_cnt++,
			  Question: q,
			  Options: option,
			  Answer: answer,
		});  
		q="";
      }
	  if(arr.length ===3){
		  let yes=false;
		  for(let i=0; i<arr.length;i++){
			  if(arr[i].includes("true") && arr[i].includes("false"))
				  yes =true;
		  }
		  if(yes){
			  let ques=$(this).text();
      let string = ques.trim().split("\n");
      let question = string.shift().replace(/^[0-9]+. /g, "");
      let option = string;
      let answer = ans.shift();
        json.push({
			  id: ans_cnt++,
			  Question: question,
			  Options: option,
			  Answer: answer,
		});
		  }
	  }
      if (arr.length === 6) {
		let ques=$(this).text();
      let string = ques.trim().split("\n");
      let question = string.shift().replace(/^[0-9]+. /g, "");
      let option = string;
      let answer = ans.shift();
        json.push({
			  id: ans_cnt++,
			  Question: question,
			  Options: option,
			  Answer: answer,
		});
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const extractMcq = async (URL,title) => {
	if(title.includes("/"))
		title = title.replace("/","-");
  if (fs.existsSync("./saved/"+title+".json")) {
		console.log(fname+" already exists");
    return;
}
  console.log("Extracting: "+title);
  let li = await extractLinks(URL);
  let ctr = 0;
  let num = li.length;
  console.time("Scraping took: ");
  for (let i = 0; i < num; i++) {
    ctr++;
    await mcqScrap(li[i]);
  }
  console.timeEnd("Scraping took: ");
  if (ctr === num) {
    writeFile(
      "./saved/" + title + ".json",
      JSON.stringify(json, null, 4),
      function (err) {
        if (err) throw err;
		json = [];
        console.log("Saved JSON!");
        console.log(`Total ${ans_cnt} questions scrapped`);
		ans_cnt = 1;
      }
    );
  }
};


export default extractMcq;
