var hiredis = require("./build/default/hiredis"),
    net = require("net");

exports.Reader = hiredis.Reader;
exports.createConnection = function(port, host) {
    var s = new net.Stream();
    var r = new hiredis.Reader();
    var _write = s.write;
    s.connect(port || 6379, host);

    s.write = function() {
        var i, args = arguments;
        _write.call(s, "*" + args.length + "\r\n");
        for (i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg instanceof Buffer) {
                _write.call(s, "$" + arg.length + "\r\n");
                _write.call(s, arg);
                _write.call(s, "\r\n");
            } else {
                _write.call(s, "$" + arg.length + "\r\n" + arg + "\r\n");
            }
        }
    }

    s.on("data", function(data) {
        var reply;
        r.feed(data);
        try {
            while(reply = r.get())
                s.emit("reply", reply);
        } catch(err) {
            r = null;
            s.emit("error", err);
            s.destroy();
        }
    });

    return s;
}
