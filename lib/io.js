'use strict';
const Fs = require('fs');
const Readline = require('readline');

const readLineTxt = function(txtFilePath, processFn, endCall) {
  // (async function processLineByLine() {
  try {
    const rl = Readline.createInterface({
      input: Fs.createReadStream(txtFilePath),
      crlfDelay: Infinity
    });

    let lineNum = 0;
    rl.on('line', (line) => {
      lineNum++;
      processFn(line, lineNum);
    });
    rl.on('close', () => {
      // vlog.log('File processed.');
      endCall(null, lineNum);
    });
    // await once(rl, 'close');

  } catch (err) {
    endCall(err);
  }
  // })();
};

exports.readLineTxt = readLineTxt;


// readLineTxt('./json.js', (line, lineNum) => {
//   console.log('[%d]:%s', lineNum, line);
// }, (err) => {
//   if (err) {
//     console.log(err);
//   }
//   console.log('----done');
// });