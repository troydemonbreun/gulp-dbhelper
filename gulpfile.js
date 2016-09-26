var fs = require('fs');
var readline = require('readline');
var gulp = require('gulp');
var concat = require('gulp-concat-util');
var utf8Convert = require('gulp-utf8-convert');
 
var databaseName;
var outputPath;
var inputBasePath;
  
var buildLines = [];
 
gulp.task('readfilenames', function(cb) {
	
	parseParams();
	
	if (databaseName.match(/LMS|LCMS/i)) { //include Common
		readFromBuildFile("Common", function() {
			readFromBuildFile(databaseName, cb)
		});		
	} else {
		readFromBuildFile(databaseName, cb);
	}
	
});

gulp.task('writesql', ['readfilenames'], function(cb) {

	//console.log(buildLines);
	gulp.src(buildLines)
		.pipe(utf8Convert({skipTextFileCheck: true}))			
		.pipe(concat.header('-- FILE : <%= file.path.toUpperCase() %>\n'))
		.pipe(concat(outputPath + "\\" + databaseName + ".sql", {
			process: function(src, filePath) { 
				return src.replace(/MY_LMS_CONNECTION_STRING/ig, 'CHANGE THIS')
					.replace(/MY_LCMS_CONNECTION_STRING/ig, 'CHANGE THIS');
			}
		}))	
		.pipe(gulp.dest('.'))
		.on('end', cb);
});

function readFromBuildFile(dbName, onClose) {
		
	var lr = readline.createInterface({
	  input: fs.createReadStream(inputBasePath + '\\' + dbName + '\\' + dbName + '_build.cmd')
	});  
	
	console.log(inputBasePath + '\\' + dbName + '\\' + dbName + '_build.cmd');
  
  	lr.on('line', function(line) {
	
		//console.log('Line from file:', inputBasePath + line);		
		var createPopulateRegEx = /((create|populate) scripts\\[^"]+)/i;
		var matches = createPopulateRegEx.exec(line);
		if (matches) {
			//console.log('MATCHES ' +  matches[1]);
			buildLines.push(inputBasePath + '\\' + dbName + '\\' + matches[1]);	
		}
	});	
  
	lr.on('close', function() {
		onClose();
	});

}

function parseParams() {
	var i = process.argv.indexOf("--databasename");
	if (i > -1) {
		databaseName = process.argv[i+1];
	}
	
	var i = process.argv.indexOf("--outputpath");
	if (i > -1) {
		outputPath = process.argv[i+1];
	}
	
	var i = process.argv.indexOf("--inputbasepath");
	if (i > -1) {
		inputBasePath = process.argv[i+1];
	}
}
