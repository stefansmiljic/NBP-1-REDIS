"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
var prikaziPoruke = false;
var poruka = false;

connection.on("ReceiveMessageList", function (messagesFromRoom) {
    document.getElementById("messagesList").innerHTML="";
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
        console.log(msg);
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
    let x = document.getElementById("userInput").value;
    if (x == "") {
        alert("Username must be filled out");
        return false;
    }
    document.querySelector("#sendButton").style.visibility = 'visible';
    document.querySelector("#messageInput").style.visibility = 'visible';
    document.querySelector("#messageParagraph").style.visibility = 'visible';
    var room = document.getElementById("roomSelector").value;
    document.querySelector(".currentRoom").value = room;
    document.body.style.backgroundColor = "#402b80";
    document.body.style.color = "white";
    document.body.style.transition = '1500ms';
    document.getElementById("userInput").disabled = true;
    connection.invoke("JoinRoom", room).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
    console.log(room)
});

window.addEventListener("load", function() {
    document.querySelector("#sendButton").style.visibility = 'hidden';
    document.querySelector("#messageInput").style.visibility = 'hidden';
    document.querySelector("#messageParagraph").style.visibility = 'hidden';
})

document.getElementById("sendButton").addEventListener("click", function (event) {
    var user = document.getElementById("userInput").value;
    var currentRoom = document.getElementById("roomSelector").value;
    var message = document.getElementById("messageInput").value;
    connection.invoke("SendMessage", currentRoom, user, message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
});