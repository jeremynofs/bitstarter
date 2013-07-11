#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var download = function(url, callback) {
  rest.get(url).on('complete', function(result) {
    if (result instanceof Error) { // also when callback(result)
      console.error("Error: %s", result.message);
      return;
    } else {
      callback(null,result); //callback(error,html)
    }
  });
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile)).sort();
};

var checkHtml = function(html, checks) {
  $ = cheerio.load(html);
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0; //is the current check present in the html?
    out[checks[ii]] = present; //populate JSON hash
  }
  return out; //return JSON hash
};

//Load local file and check it synchronously. For export only.
var checkHtmlFile = function(filename, checks) {
  return checkHtml(fs.readFileSync(filename), checks);
};

var assertFileExists = function(filename) {
  var filename = filename.toString(); //cast to string
    if(!fs.existsSync(filename)) { //File doesn't exist
      console.log("%s does not exist. Exiting.", filename);
      process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
  return filename;
};

var clone = function(fn) {
  //Workaround for commander.js issue. See http://stackoverflow.com/a/67772648
  return fn.bind({});
};

if(require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to check file', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to html file to be checked', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <URL>', 'URL to html file to be checked')
    .parse(process.argv);

  function checkIt(error, html) {
    if(error) {
      console.error("Error getting html: %s", error);
      process.exit(1);
    }
    // Stuff that happens each time goes here
    var checks = loadChecks(program.checks);
    var checkJson = checkHtml(html, checks); //refactored checkHtmlFile function
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }

  program.url ? 
      download(program.url, checkIt)        //Download url and check it
    : fs.readFile(program.file, checkIt);   //Asynchronous now for local files, too

} else { //exports
  exports.checkHtmlFile = checkHtmlFile;
}


