using Microsoft.AspNetCore.SignalR;

namespace ChatAppServer.WebAPI.Hubs
{
    public class CallHub : Hub
    {
        public async Task SendOffer(string user, string offer)
        {
            await Clients.User(user).SendAsync("ReceiveOffer", offer);
        }

        public async Task SendAnswer(string user, string answer)
        {
            await Clients.User(user).SendAsync("ReceiveAnswer", answer);
        }

        public async Task SendCandidate(string user, string candidate)
        {
            await Clients.User(user).SendAsync("ReceiveCandidate", candidate);
        }
    }
}
