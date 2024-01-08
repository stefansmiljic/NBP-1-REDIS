using System.Diagnostics.CodeAnalysis;

public class Message{
    public required string text { get; set; }
    public required string user { get; set; }
    public required DateTime time { get; set; }
    public string RoomName { get; set; }

    [SetsRequiredMembers]
    public Message(string text, string user, DateTime time, string roomName)
    {
        this.text = text;
        this.user = user;
        this.time = time;
        this.RoomName = roomName;
    }
}