const net = require("net");
const fs = require("fs");
const path = require("path");

const directory = process.argv[3];

if (!directory) {
  console.error(
    "Error: Please provide a directory path using --directory flag."
  );
  process.exit(1);
}

console.log("Logs from your program will appear here!");
console.log("Serving files from:", directory);

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on("data", (data) => {
    const request = data.toString();
    const pathRequested = request.split(" ")[1];
    let responseStatus = "404 Not Found";
    let responseBody = "";
    let contentType = "text/plain";
    let contentLength = 0;

    if (pathRequested.startsWith("/files/")) {
      const filename = pathRequested.slice(7);
      const filePath = path.join(directory, filename);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        } else {
          fs.readFile(filePath, (err, data) => {
            if (err) {
              socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            } else {
              responseStatus = "200 OK";
              responseBody = data.toString();
              contentLength = stats.size;
              contentType = "application/octet-stream";

              socket.write(`HTTP/1.1 ${responseStatus}\r\n`);
              socket.write(`Content-Type: ${contentType}\r\n`);
              socket.write(`Content-Length: ${contentLength}\r\n`);
              socket.write(`\r\n`);

              socket.write(data);
            }
          });
        }
      });
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });
});

server.listen(4221, () => {
  console.log("Server is listening on port 4221");
  console.log("http://localhost:4221/");
});
