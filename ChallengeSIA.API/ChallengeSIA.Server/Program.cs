using ChallengeSIA.Server.Model;
using System;
using System.Threading.Tasks;

namespace WindowMonitor
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            Console.WriteLine("Iniciando servidor WebSocket para monitorear ventanas...");

            // Inicia el servidor WebSocket que manejará las conexiones y monitoreará las ventanas
            await WebSocketComunication.StartServerAsync();
        }
    }
}
