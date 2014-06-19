var q = require('q');

module.exports = function(stdin, stdout, stderr, args) {
    return q.fcall(function() {
        stdout.write(args.join(' '));
        return 0;
    });
};