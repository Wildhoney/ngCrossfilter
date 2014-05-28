(function($process) {

    "use strict";

    var express     = require('express'),
        app         = express(),
        server      = require('http').createServer(app);

    // Begin Express so the statistics are available from the `localPort`.
    app.use(express.static(__dirname + '/../example'));
    server.listen($process.env.PORT || 3502);

})(process);