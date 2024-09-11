using ChallengeSIA.API.Data;
using ChallengeSIA.Server.Model;
using DataAccess.Service;
using DataAccess.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace WindowMonitor
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            var positionService = host.Services.GetRequiredService<IPositionService>();
            Console.WriteLine("Iniciando servidor WebSocket para monitorear ventanas...");

            await WebSocketComunication.StartServerAsync(positionService);
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                })
                .ConfigureServices((context, services) =>
                {
                    // Configuración del ApplicationDbContext
                    var connectionString = context.Configuration.GetConnectionString("DefaultConnection");
                    services.AddDbContext<ApplicationDbContext>(options =>
                        options.UseSqlServer(connectionString));

                    // Registramos los servicios
                    services.AddScoped<IPositionService, PositionService>();
                });
    }
}
