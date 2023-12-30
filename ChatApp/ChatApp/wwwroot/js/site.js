"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable the send button until connection is established.
document.getElementById("sendButton").disabled = true;

connection.on("ReceiveMessageList", function (list) {
    for(let i = 0; i<list.length; i++ )
    {
        var li = document.createElement("li");
        document.getElementById("messagesList").appendChild(li);
        let user = list[i].user;
        let message = list[i].text;
        let time = list[i].time;
        var datum = new Date(time).toLocaleDateString("sr-RS");
        var vreme = new Date(time).toLocaleTimeString("sr-RS");
    
        // We can assign user-supplied strings to an element's textContent because it
        // is not interpreted as markup. If you're assigning in any other way, you 
        // should be aware of possible script injection concerns.
        li.textContent = `${user} says ${text} at ${datum} : ${vreme}`;
    }
});

connection.on("ReceiveMessage", function (user, text, time) {
        var li = document.createElement("li");
        document.getElementById("messagesList").appendChild(li);
        var datum = new Date(time).toLocaleDateString("sr-RS");
        var vreme = new Date(time).toLocaleTimeString("sr-RS");
        // We can assign user-supplied strings to an element's textContent because it
        // is not interpreted as markup. If you're assigning in any other way, you 
        // should be aware of possible script injection concerns.
        li.textContent = `${user} says ${text} at ${datum} : ${vreme}`;
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
}).catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    var user = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;
    connection.invoke("SendMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
});