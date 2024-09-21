let http = require('http');
let url = require('url');
let fs = require('fs');

function startServer(actions) {

    http.createServer((req, res) => {

        let q = url.parse(req.url, true);

        if (q.pathname.startsWith('/api')) {

            console.log(q.pathname);
            
            let action = q.pathname.substring(4);
            if (!actions[action]) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('no such action');
                return;
            }
            actions[action](req, res, q);

        } else {
            //static file
            let allowedContentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js' : 'text/javascript',
                '.png' : 'image/png',
                '.wav' : 'audio/wav',
                '.mp3' : 'audio/mpeg',
                '.jpg' : 'image/jpeg',
                '.ico' : 'image/x-icon'
            };

            let filename = null;
            if (q.pathname == '/')
                filename = '/index.html';
            else filename = q.pathname;

            let indexOfDot = filename.indexOf('.');
            if (indexOfDot == -1) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('invalid file name..');
                return;
            }
            let extension = filename.substring(indexOfDot);
            let contentType = null;
            if (allowedContentTypes[extension]) {
                contentType = allowedContentTypes[extension];

            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('invalid extension..');
                return;
            }

            fs.readFile(filename.substring(1), (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('file not found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });

        }
    }).listen(8082);
}
exports.startServer = startServer;
