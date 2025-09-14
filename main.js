const http = require("http");
const path = require("path");
const fs = require("fs");

function serve(rootDirectory, port)
{
    let server = new http.Server();

    server.listen(port);
    console.log("Listening on port", port)

    server.on("request", (request, response) => {
        let host = request.headers.host;
        let protocol = "http";
        let baseUrl = `${protocol}://${host}`;
        let endpoint = URL.parse(request.url, baseUrl).pathname;

        if (endpoint === "/test/mirror") {
            response.setHeader("Content-Type", "text/plain; charset=UTF-8");
            response.writeHead(200);
            response.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);

            let headers = request.rawHeaders;
            for (let i = 0; i < headers.length; i += 2)
                response.write(`${headers[i]}: ${headers[i + 1]}\r\n`);

            response.write("\r\n");
            request.pipe(response);
        }
        else {
            let filename = endpoint.substring(1);

            filename.replace(/\.\.\//g, "");
            filename = path.resolve(rootDirectory, filename);

            let type;

            switch (path.extname(filename)) {
                case ".html":
                case ".htm":
                    type = "text/html";
                    break;
                case ".js":
                    type = "text/javascript";
                    break;
                case ".css":
                    type = "text/css";
                    break;
                case ".png":
                    type = "image/png";
                    break;
                case ".txt":
                    type = "text/plain; charset=UTF-8";
                    break;
                default:
                    type = "application/octet-stream";
                    break;
            }

            let stream = fs.createReadStream(filename);

            stream.once("readable", () => {
                response.setHeader("Content-Type", type);
                response.writeHead(200);
                stream.pipe(response);
            });

            stream.on("error", err => {
                response.setHeader("Content-Type", "text/plain; charset=UTF-8");
                response.writeHead(404);
                response.end(err.message);
            });
        }
    });
}

serve(process.argv[2] || "/tmp", parseInt(process.argv[3]) || 8000);