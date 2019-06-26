"use strict";

const webSocket = require("ws"),
    ws = new webSocket.Server({
        port: 3000
    });

let speeches = 0;

function formatMsg(type, data) {
    if (!data.sender) data.sender = "admin";
    return JSON.stringify({type, data});
}

function broadcast(msg, ignored) {
    if (!Array.isArray(ignored)) ignored = [ignored];
    for (let socket of ws.clients) {
        !~ignored.indexOf(socket) && socket.send(msg);
    }
}

function broadcastJoin(address) {
    broadcast(formatMsg("message", {msg: `用户 ${address} 加入了聊天室。`, online: ws.clients.size}));
}

function broadcastLeave(address) {
    broadcast(formatMsg("message", {msg: `用户 ${address} 离开了聊天室。`, online: ws.clients.size}));
}

function ackAndBroadcast(msg, socket) {
    speeches += 1;
    socket.speeches = (socket.speeches || 0) + 1;
    socket.send(formatMsg("ack", {
        id: msg.id,
        speeches,
        mySpeeches: socket.speeches
    }));
    broadcast(formatMsg("message", {
        msg: msg.msg,
        sender: msg.sender,
        speeches
    }), socket);
}

function updateMeta(socket, req) {
    let address = req.connection.remoteAddress,
        meta = {
            ip: address,
            online: ws.clients.size,
            mySpeeches: socket.speeches || 0,
            speeches
        };
    socket.send(formatMsg("information", meta));
}

ws.on("connection", (socket, req) => {
    let address = req.connection.remoteAddress;
    broadcastJoin(address);
    console.log(`${address} joined.`);

    socket.on("close", () => {
        broadcastLeave(address);
        console.log(`${address} leave.`);
    });

    socket.on("message", (msg) => {
        msg = JSON.parse(msg);
        console.log("received:", msg);
        switch (msg.type) {
            case "message":
                msg.data.sender = address;
                ackAndBroadcast(msg.data, socket);
                break;
            case "update-information":
                updateMeta(socket, req);
                break;
            default:
                break;
        }
    });
});
