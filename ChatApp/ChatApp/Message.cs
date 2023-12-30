using System.Diagnostics.CodeAnalysis;

public class Message{
    public required string text { get; set; }
    public required string user { get; set; }
    public required DateTime time { get; set; }

    [SetsRequiredMembers]
    public Message(string text, string user, DateTime time)
    {
        this.text = text;
        this.user = user;
        this.time = time;
    }
}