var q = require('q');

module.exports = function(stdin, stdout, stderr) {
    return q.fcall(function() {
        return 1;
    });
};