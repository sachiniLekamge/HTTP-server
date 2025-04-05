const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });
  socket.on("data", (data) => {
    const path = data.toString().split(" ")[1];
    const responseStatus = path === "/" ? "200 OK" : "404 Not Found";
    socket.write(`HTTP/1.1 ${responseStatus}\r\n\r\n`);
  });
});

server.listen(4221, () => {
  console.log("Server is listening on port 4221");
  console.log("http://localhost:4221/");
});
