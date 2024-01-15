"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
var prikaziPoruke = false;
//Disable the send button until connection is established.
document.getElementById("sendButton").disabled = true;

connection.on("ReceiveMessageList", function (messagesFromRoom) {
    console.log(messagesFromRoom.length)
    for(var i = 0; i<messagesFromRoom.length; i++ )
    {
        console.log(messagesFromRoom[i].text)
        var li = document.createElement("li");
        document.getElementById("messagesList").appendChild(li);
        let user = messagesFromRoom[i].user;
        let message = messagesFromRoom[i].text;
        //let time = messagesFromRoom[i].time;
        //var datum = new Date(time).toLocaleDateString("sr-RS");
        //var vreme = new Date(time).toLocaleTimeString("sr-RS");
    
        // We can assign user-supplied strings to an element's textContent because it
        // is not interpreted as markup. If you're assigning in any other way, you 
        // should be aware of possible script injection concerns.
        // li.textContent = `${user} says ${message} at ${datum} : ${vreme}`;
        li.textContent = `${user}: ${message}`;
    }
});

connection.on("ReceiveActiveRooms", (activeRooms) => {
    console.log("Active rooms:", activeRooms);

    // Handle the list of active rooms, e.g., update UI
    updateRoomList(activeRooms);
});

connection.on("InvalidUsername", (errorMessage) => {
    // Handle the invalid username message, e.g., display an error to the user
    console.error("Invalid username:", errorMessage);
});

function updateRoomList(activeRooms) {
    const roomList = document.getElementById("roomSelector");
    roomList.innerHTML = "";  // Clear existing list

    activeRooms.forEach((room) => {
        const li = document.createElement("option");
        li.textContent = room;
        roomList.appendChild(li);
    });
}

connection.on("ReceiveMessage", function (msg) {
        var li = document.createElement("li");
        document.getElementById("messagesList").appendChild(li);
        // var datum = new Date(time).toLocaleDateString("sr-RS");
        // var vreme = new Date(time).toLocaleTimeString("sr-RS");
        // We can assign user-supplied strings to an element's textContent because it
        // is not interpreted as markup. If you're assigning in any other way, you 
        // should be aware of possible script injection concerns.
        // li.textContent = `${user} says ${text} at ${datum} : ${vreme}`;
        li.textContent = `${msg.user}: ${msg.text}`;
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
}).catch(function (err) {
    return console.error(err.toString());
});

connection.on("JoinedRoom", (roomName) => {
    console.log(`Joined room: ${roomName}`);
});

function createRoom() {
    const newRoomName = prompt("Enter the name of the new room:");
    if (newRoomName) {
        connection.invoke("CreateRoom", newRoomName);
    }
}

document.getElementById("addRoom").addEventListener("click", function (event) {
    var room = document.getElementById("roomName").value;
    connection.invoke("CreateRoom", room).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
    console.log(room)
});

document.getElementById("joinRoom").addEventListener("click", function (event) {
    var room = document.getElementById("roomSelector").value;
    connection.invoke("JoinRoom", room).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
    console.log(room)
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    var user = document.getElementById("userInput").value;
    var currentRoom = document.getElementById("roomSelector").value;
    var message = document.getElementById("messageInput").value;
    connection.invoke("SendMessage", currentRoom, user, message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
});