var resolver = require('./resolver');

var CodeBuilder = module.exports = exports = function CodeBuilder(q) {
    this.codes = [];
    this.q = q;
};

CodeBuilder.prototype = {
    /**
     *  load stdin, stdout and stderr from stack
     *  load args
     *  return $?
     */
    call: function(name, args) {
        var n = this.codes.push(function(stack, vars, ops, next) {
            var stderr = stack.pop();
            var stdout = stack.pop();
            var stdin = stack.pop();

            ops[name](stdin, stdout, stderr, resolver(args, vars)).then(function(exitCode) {
                vars.set('?', exitCode);
                next(n);
            });
        });
        return this;
    },
    /**
     *  load stdin, stdout and stderr from stack
     *  load args
     *  return $!
     */
    callFork: function(name, args) {
        var n = this.codes.push(function(stack, vars, ops, next) {
            var stderr = stack.pop();
            var stdout = stack.pop();
            var stdin = stack.pop();
            var pid = this.inc ? ++this.inc : this.inc = 1;

            ops[name](stdin, stdout, stderr, resolver(args, vars)).then(function(exitCode) {
                if (!this.forkResult) {
                    this.forkResult = {};
                }

                this.forkResult[pid] = exitCode;

                if (this.waiting && this.waiting[pid]) {
                    this.waiting[pid](exitCode);
                }
            }.bind(this));

            vars.set('!', pid);
            next(n);
        }.bind(this))
    },
    /**
     *  return $?
     */
    wait: function(name, pid) {
        var n = this.codes.push(function(stack, vars, ops, next) {
            if (this.forkResult && typeof this.forkResult[pid] !== 'undefined') {
                vars.set('?', this.forkResult[pid]);
                next(n);
            } else {
                if (!this.waiting) {
                    this.waiting = {};
                }
                this.waiting[pid] = function(exitCode) {
                    vars.set('?', exitCode);
                    next(n);
                };
            }
        }.bind(this));
    },
    jump: function(n) {
        this.codes.push(function(stack, vars, ops, next) {
            next(n);
        });
    },
    jumpIfFalse: function(n) {
        var m = this.codes.push(function(stack, vars, ops, next) {
            if (vars.getNumber('?') !== 0) {
                next(m);
            } else {
                next(n);
            }
        });
    },
    loadStream: function(stream) {
        var n = this.codes.push(function(stack, vars, ops, next) {
            stack.push(stream);
            next(n);
        });
    }
};