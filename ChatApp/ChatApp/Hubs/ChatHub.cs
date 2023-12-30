using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;

namespace ChatApp.Hubs
{
    public class ChatHub : Hub
    {
        private IDatabase redis;
        public ChatHub(RedisConnection rc)
        {
            redis = rc.GetDatabase();
        }

        public async Task SendMessage(string user, string message)
        {
            var msgClass = new Message(message, user, DateTime.Now);
            await redis.PublishAsync("sendPubSub", JsonSerializer.Serialize<Message>(msgClass));
        }

        public override async Task OnConnectedAsync()
        {
           var messages = await redis.StreamRangeAsync("send");
           List<Message> list = new List<Message>();
           foreach(var msg in messages)
           {
            var msg_str = msg["message"];
              var msg_ds = JsonSerializer.Deserialize<Message>(msg_str);
              list.Add(msg_ds!);
           }
           await Clients.Caller.SendAsync("ReceiveMessageList", list);
        }
    }
}