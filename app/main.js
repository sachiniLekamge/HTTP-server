const fs = require("fs");
const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  let requestBody = "";

  socket.on("close", () => {
    socket.end();
  });

  socket.on("data", (data) => {
    const req = data.toString();
    console.log(req);

    const [method, path] = req.split("\r\n")[0].split(" ");

    if (method === "GET" && path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (method === "GET" && path.startsWith("/files/")) {
      const directory = process.argv[3];
      const filename = path.split("/files/")[1];

      if (fs.existsSync(`${directory}/${filename}`)) {
        const content = fs.readFileSync(`${directory}/${filename}`).toString();
        const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
        socket.write(res);
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (method === "POST" && path.startsWith("/files/")) {
      const directory = process.argv[3];
      const filename = path.split("/files/")[1];
      const contentLengthLine = req
        .split("\r\n")
        .find((line) => line.startsWith("Content-Length:"));
      const contentLength = parseInt(
        contentLengthLine.split(":")[1].trim(),
        10
      );
      requestBody = req.split("\r\n\r\n")[1].slice(0, contentLength);
      fs.writeFileSync(`${directory}/${filename}`, requestBody);
      const res = `HTTP/1.1 201 Created\r\n\r\n`;
      socket.write(res);
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end();
  });
});

server.listen(4221, () => {
  console.log("Server is listening on port 4221");
  console.log("http://localhost:4221/");
});
