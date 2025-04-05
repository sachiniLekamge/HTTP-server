const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    // server.close();
  });

  socket.on("data", (data) => {
    const request = data.toString();
    const path = request.split(" ")[1];
    let responseStatus = "404 Not Found";
    let responseBody = "";
    let contentType = "text/plain";
    let contentLength = 0;

    const echoMatch = path.match(/^\/echo\/(.+)$/);
    if (path === "/" || echoMatch) {
      responseStatus = "200 OK";
      if (echoMatch) {
        responseBody = echoMatch[1];
        contentLength = responseBody.length;
      }
    }

    const userAgentMatch = path === "/user-agent";
    if (userAgentMatch) {
      const userAgentHeader = request
        .split("\r\n")
        .find((line) => line.startsWith("User-Agent:"));
      if (userAgentHeader) {
        responseStatus = "200 OK";
        responseBody = userAgentHeader.split(": ")[1];
        contentLength = responseBody.length;
      }
    }

    socket.write(`HTTP/1.1 ${responseStatus}\r\n`);
    socket.write(`Content-Type: ${contentType}\r\n`);
    socket.write(`Content-Length: ${contentLength}\r\n`);
    socket.write(`\r\n`);

    if (responseStatus === "200 OK") {
      socket.write(responseBody);
    }
  });
});

server.listen(4221, () => {
  console.log("Server is listening on port 4221");
  console.log("http://localhost:4221/");
});
