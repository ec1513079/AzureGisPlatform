var fs = require("fs")
  , fstream = require("fstream")
  , mkdirp = require("mkdirp")
  , unzipper = require("unzipper")
  , memStreams = require('memory-streams');

module.exports = function (context, shapeBlob) {

    context.log("JavaScript blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", shapeBlob.length, "Bytes");

    var execPath = context.executionContext.functionDirectory;

    // 作業ディレクトリの作成
    var tmpDir = `${execPath}\\tmp\\${context.invocationId}`;
    mkdirp(tmpDir, function (err) {
        if (err) {
            context.log.error(err);
            context.done();
        } else {
            context.log(`TmpDir : ${tmpDir}`);

            // ZIPファイル解凍
            var zipStream = new memStreams.ReadableStream(shapeBlob);
            zipStream.pipe(unzipper.Extract({
                path: tmpDir
            })).on('error', function(err){
                context.log.error(err);
                context.done();
            }) .on('close', function(){
                context.done();
            });

        }
    });

};