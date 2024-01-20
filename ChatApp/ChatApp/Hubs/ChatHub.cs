using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using System.Collections.Concurrent;

namespace ChatApp.Hubs
{
    public class ChatHub : Hub
    {
        private IDatabase redis;
        //private IHostedService<RedisNotificationService> notificationService;
        public ChatHub(RedisConnection rc)
        {
            redis = rc.GetDatabase();
            ActiveRooms = redis.SetMembers("ActiveRooms").Select(r=>r.ToString()).ToList();
        }

        private static readonly ConcurrentDictionary<string, string> UserToRoomMap = new ConcurrentDictionary<string, string>();
        private static List<string> ActiveRooms;

        public async Task CreateRoom(string roomName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            UserToRoomMap[Context.ConnectionId] = roomName;
            if (!ActiveRooms.Contains(roomName))
            {
                ActiveRooms.Add(roomName);
                await Clients.All.SendAsync("ReceiveActiveRooms", ActiveRooms);
            }
            await redis.SetAddAsync("ActiveRooms", roomName);
            await UpdateActiveRooms();
            //await Clients.Caller.SendAsync("CreatedRoom", roomName);
            var msgClass = new Message(Context.ConnectionId, "System", DateTime.Now, roomName);
            await Clients.Group(roomName).SendAsync("ReceiveMessage", $"{msgClass.text} created the room, {msgClass.user}, {msgClass.time}" );
        }

        public async Task JoinRoom(string roomName)
        {
            foreach(var idRoom in UserToRoomMap)
            {
                if(idRoom.Key == Context.ConnectionId)
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, idRoom.Value);
                }
            }
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            UserToRoomMap[Context.ConnectionId] = roomName;
            if (!ActiveRooms.Contains(roomName))
            {
                ActiveRooms.Add(roomName);
                await Clients.All.SendAsync("ReceiveActiveRooms", ActiveRooms);
            }
            await Clients.Caller.SendAsync("JoinedRoom", roomName);
            var msgClass = new Message($"User {Context.ConnectionId} joined the room.", "System", DateTime.Now, roomName);
            // Notify the group that a user has joined
            // await Clients.Group(roomName).SendAsync("ReceiveMessage", $"{msgClass.text} joined the room, {msgClass.user}, {msgClass.time}, {msgClass.RoomName}" );
            await Clients.GroupExcept(roomName, new []{Context.ConnectionId}).SendAsync("ReceiveMessage", msgClass);
            var messagesFromRoom = await GetOlderMessages(roomName);
            await Clients.Caller.SendAsync("ReceiveMessageList", messagesFromRoom);
        }

        private async Task UpdateActiveRooms()
        {
            var activeRooms = await redis.SetMembersAsync("ActiveRooms");
            await Clients.All.SendAsync("ReceiveActiveRooms", activeRooms.Select(r => r.ToString()));
        }

        private async Task GetActiveRooms()
        {
            var activeRooms = await redis.SetMembersAsync("ActiveRooms");
            await Clients.Caller.SendAsync("ReceiveActiveRooms", activeRooms.Select(r => r.ToString()));
        }

        public async Task SendMessage(string roomName, string user, string message)
        {
            var msgClass = new Message(message, user, DateTime.Now, roomName);
            await redis.PublishAsync("sendPubSub", JsonSerializer.Serialize<Message>(msgClass));
            await redis.StreamAddAsync("send", new NameValueEntry[]{new NameValueEntry("message", JsonSerializer.Serialize<Message>(msgClass))});
        }

        private async Task<List<Message>> GetOlderMessages(string roomName)
        {
            var messages = await redis.StreamRangeAsync("send");
            var messageList = new List<Message>();

            foreach (var msg in messages)
            {
                var msgStr = msg["message"];
                if(msgStr.IsNullOrEmpty)
                    continue;
                var msgObj = JsonSerializer.Deserialize<Message>(msgStr);
                if(msgObj.RoomName == roomName)
                    messageList.Add(msgObj!);
            }

            return messageList;
        }

        public override async Task OnConnectedAsync()
        {
           /*var messages = await redis.StreamRangeAsync("send");
           List<Message> list = new List<Message>();
           foreach(var msg in messages)
           {
            var msg_str = msg["message"];
              var msg_ds = JsonSerializer.Deserialize<Message>(msg_str);
              list.Add(msg_ds!);
           }
           await Clients.Caller.SendAsync("ReceiveMessageList", list);*/
           await Clients.Caller.SendAsync("ReceiveActiveRooms", ActiveRooms);
           await GetActiveRooms();
           await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            if (UserToRoomMap.TryGetValue(Context.ConnectionId, out var roomName))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
                var msgClass = new Message(Context.ConnectionId, "System", DateTime.Now, roomName);
                await Clients.Group(roomName).SendAsync("ReceiveMessage", $"{msgClass.text} left the room, {msgClass.user}, {msgClass.time}, {msgClass.RoomName}");

                UserToRoomMap.TryRemove(Context.ConnectionId, out _);

                if (!UserToRoomMap.Values.Any(r => r == roomName) && ActiveRooms.Contains(roomName))
                {
                    ActiveRooms.Remove(roomName);
                    await Clients.All.SendAsync("ReceiveActiveRooms", ActiveRooms);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}