using System.Diagnostics;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace ChallengeSIA.Server.Model
{
    public class WebSocketComunication
    {
        private const int SW_RESTORE = 9;
        private const int SW_SHOW = 5;
        private static Dictionary<IntPtr, WindowComunication.RECT> notepads = new Dictionary<IntPtr, WindowComunication.RECT>();

        public static async Task StartServerAsync()
        {
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:5000/ws/");
            listener.Start();
            Console.WriteLine("Servidor WebSocket iniciado en ws://localhost:5000/ws/");

            while (true)
            {
                var context = await listener.GetContextAsync();
                if (context.Request.IsWebSocketRequest)
                {
                    HttpListenerWebSocketContext wsContext = await context.AcceptWebSocketAsync(null);
                    WebSocket webSocket = wsContext.WebSocket;
                    _ = Task.Run(() => MonitorNotepadWindows(notepads, webSocket));
                    _ = Task.Run(() => ReceiveMessages(webSocket, notepads));
                }
            }
        }

        static async Task MonitorNotepadWindows(Dictionary<IntPtr, WindowComunication.RECT> windowStates, WebSocket webSocket)
        {
            while (webSocket.State == WebSocketState.Open)
            {
                WindowComunication.EnumWindows((hWnd, lParam) =>
                {
                    StringBuilder className = new StringBuilder(256);
                    WindowComunication.GetClassName(hWnd, className, className.Capacity);

                    if (className.ToString().Contains("Notepad"))
                    {
                        WindowComunication.RECT rect;
                        if (WindowComunication.GetWindowRect(hWnd, out rect))
                        {
                            if (!windowStates.ContainsKey(hWnd) || !windowStates[hWnd].Equals(rect))
                            {
                                windowStates[hWnd] = rect;
                                var window = new WindowData
                                {
                                    WindowType = hWnd.ToString("X"),
                                    Position = new PositionData
                                    {
                                        Bottom = rect.Bottom,
                                        Left = rect.Left,
                                        Right = rect.Right,
                                        Top = rect.Top
                                    }
                                };

                                string jsonString = JsonSerializer.Serialize(window);
                                var messageBytes = Encoding.UTF8.GetBytes(jsonString);
                                _ = webSocket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, CancellationToken.None);

                                Console.WriteLine($"Ventana detectada/actualizada: {hWnd.ToString("X")} - Posición: ({rect.Left}, {rect.Top}) Tamaño: ({rect.Right - rect.Left}, {rect.Bottom - rect.Top})");
                            }
                        }
                    }
                    return true;
                }, IntPtr.Zero);

                await Task.Delay(1000);
            }
        }

        static async Task ReceiveMessages(WebSocket webSocket, Dictionary<IntPtr, WindowComunication.RECT> windowStates)
        {
            var buffer = new byte[1024 * 4];
            while (webSocket.State == WebSocketState.Open)
            {
                try
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Cierre normal", CancellationToken.None);
                    }
                    else
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        var windowData = JsonSerializer.Deserialize<WindowData>(message);

                        if (windowData != null)
                        {
                            if (!string.IsNullOrEmpty(windowData.WindowType))
                            {
                                await UpdateWindowPosition(windowData, windowStates);
                            }
                            else
                            {
                                await OpenNotepadInstances();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error en la recepción del mensaje: {ex.Message}");
                }
            }
        }
        static async Task OpenNotepadInstances()
        {
            var maxInstances = 2;
            var notepadInstances = WindowComunication.FindOpenNotepads("Sin titulo");

            if (notepadInstances.Count >= maxInstances)
            {
                Console.WriteLine("Ya hay dos instancias de Notepad abiertas.");
                return;
            }

            var instancesToOpen = maxInstances - notepadInstances.Count;

            var positions = new[]
            {
              new WindowComunication.RECT { Left = 100, Top = 100, Right = 500, Bottom = 400 },  
              new WindowComunication.RECT { Left = 620, Top = 100, Right = 1120, Bottom = 400 }  
             };

            for (int i = 0; i < instancesToOpen; i++)
            {
                var process = Process.Start("notepad.exe");

                IntPtr hWnd = IntPtr.Zero;
                while (hWnd == IntPtr.Zero)
                {
                    hWnd = process.MainWindowHandle;
                }

                WindowComunication.SetWindowText(hWnd, $"Sin titulo {i + 1}");

                if (hWnd != IntPtr.Zero)
                {
                    var rect = positions[i];
                    WindowComunication.SetWindowPos(hWnd, IntPtr.Zero, rect.Left, rect.Top,
                        rect.Right - rect.Left, rect.Bottom - rect.Top, 0);
                    notepads[hWnd] = rect; 
                }
            }
        }

        static async Task UpdateWindowPosition(WindowData windowData, Dictionary<IntPtr, WindowComunication.RECT> windowStates)
        {
            try
            {
                WindowComunication.RECT newRect = new WindowComunication.RECT
                {
                    Left = windowData.Position.Left,
                    Top = windowData.Position.Top,
                    Right = windowData.Position.Right,
                    Bottom = windowData.Position.Bottom
                };

                IntPtr hWndRecovered = (IntPtr)Convert.ToInt64(windowData.WindowType, 16);

                if (hWndRecovered != IntPtr.Zero)
                {
                    WindowComunication.SetWindowPos(hWndRecovered, IntPtr.Zero, newRect.Left, newRect.Top, newRect.Right - newRect.Left, newRect.Bottom - newRect.Top, 0);
                    windowStates[hWndRecovered] = newRect;

                    Console.WriteLine($"Ventana actualizada: {windowData.WindowType} - Posición: ({newRect.Left}, {newRect.Top}) Tamaño: ({newRect.Right - newRect.Left}, {newRect.Bottom - newRect.Top})");
                }
                else
                {
                    Console.WriteLine($"Ventana no encontrada: {windowData.WindowType}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al actualizar la posición de la ventana: {ex.Message}");
            }
        }
    }
}
