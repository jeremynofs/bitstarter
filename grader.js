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
var util = require('util')
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var crypto = require('crypto');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://localhost/index.html";
var DOWNLOADED_TEMP = crypto.randomBytes(4).readUInt32LE(0)+'.tmp';

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var buildfn = function(downloadedfile) {
    console.error("Entering buildfn(%s)...", downloadedfile);
    var response2console = function(result, response) {
	console.error("Beginning of response2console: %s", response.message);
	if (result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
	} else {
	    console.error("Wrote %s", downloadedfile);
	    fs.writeFileSync(downloadedfile, result);
	}
	console.error("I'm Here!");
    };
    return response2console;
};

var assertURLExists = function(inurl) {
    var response2console = buildfn(DOWNLOADED_TEMP);
    rest.get(inurl).on('complete', response2console);
    console.error("I'm about to assert if %s exists. (Downloaded from %s)", DOWNLOADED_TEMP, inurl);
    return assertFileExists(DOWNLOADED_TEMP);
};
	    

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_to_file>', 'URL to html file', clone(assertURLExists))
        .parse(process.argv);
    var checkJson;
    if (program.url) {
	checkJson = checkHtmlFile(DOWNLOADED_TEMP, program.checks);
    } else {
	checkJson = checkHtmlFile(program.file, program.checks);
    }
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
