using DataAccess.Entity;
using DataAccess.Service.IService;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics;
using System.Net;
using System.Net.WebSockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using static ChallengeSIA.Server.Model.WindowComunication;

namespace ChallengeSIA.Server.Model
{
    public class WebSocketComunication
    {
        private static Dictionary<IntPtr, WindowComunication.RECT> notepadWindows = new Dictionary<IntPtr, WindowComunication.RECT>();
        private static IPositionService _positionService;
        private static WebSocket _webSocket;

        public WebSocketComunication(IPositionService positionService)
        {
            _positionService = positionService;
        }

        public static async Task StartServerAsync(IPositionService positionService)
        {
            _positionService = positionService;
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
                    _webSocket = wsContext.WebSocket;
                    _ = Task.Run(() => MonitorNotepadWindows(webSocket));
                    _ = Task.Run(() => ReceiveMessages(webSocket));
                }
            }
        }

        private static async Task MonitorNotepadWindows(WebSocket webSocket)
        {
            while (webSocket.State == WebSocketState.Open)
            {
                try
                {
                    List<IntPtr> closedWindows = new List<IntPtr>();

                    WindowComunication.EnumWindows((hWnd, lParam) =>
                    {
                        var className = new StringBuilder(256);
                        WindowComunication.GetClassName(hWnd, className, className.Capacity);

                        if (className.ToString().Contains("Notepad"))
                        {
                            if (WindowComunication.GetWindowRect(hWnd, out var rect))
                            {
                                if (!WindowComunication.IsWindowVisible(hWnd))
                                {
                                    closedWindows.Add(hWnd);
                                    return true;
                                }

                                if (notepadWindows.ContainsKey(hWnd) && !notepadWindows[hWnd].Equals(rect))
                                {
                                    notepadWindows[hWnd] = rect;
                                    var position = CreatePosition(rect, hWnd);
                                    _ = _positionService.SavePositionAsync(position);
                                    var windowData = CreateWindowData(hWnd, position);
                                    _ = SendWindowDataAsync(webSocket, windowData);
                                    LogWindowUpdate(hWnd, rect);
                                }
                            }
                        }

                        return true;
                    }, IntPtr.Zero);

                    CheckClosedNotepadInstances();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error al monitorear las ventanas: {ex.Message}");
                }

                await Task.Delay(1000);
            }
        }

        private static void LogWindowClosed(IntPtr hWnd)
        {
            Console.WriteLine($"Ventana cerrada: {hWnd.ToString("X")}");
        }


        private static Position CreatePosition(WindowComunication.RECT rect, IntPtr hWnd)
        {
            var windowText = new StringBuilder(256);
            WindowComunication.GetWindowText(hWnd, windowText, windowText.Capacity);

            return new Position
            {
                Type = windowText.ToString(),
                Left = rect.Left,
                Top = rect.Top,
                Right = rect.Right,
                Bottom = rect.Bottom
            };
        }

        private static WindowData CreateWindowData(IntPtr hWnd, Position position)
        {
            return new WindowData
            {
                WindowType = hWnd.ToString("X"),
                Position = position
            };
        }

        private static async Task SendWindowDataAsync(WebSocket webSocket, WindowData windowData)
        {
            string jsonString = JsonSerializer.Serialize(windowData);
            Console.WriteLine($"Enviando data: {jsonString}");
            var messageBytes = Encoding.UTF8.GetBytes(jsonString);
            await webSocket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }

        private static void LogWindowUpdate(IntPtr hWnd, WindowComunication.RECT rect)
        {
            Console.WriteLine($"Ventana detectada/actualizada: {hWnd.ToString("X")} - Posición: ({rect.Left}, {rect.Top}) Tamaño: ({rect.Right - rect.Left}, {rect.Bottom - rect.Top})");
            
        }

        private static async Task ReceiveMessages(WebSocket webSocket)
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
                            if (windowData.Position == null && !string.IsNullOrEmpty(windowData.WindowType))
                            {
                                await CloseWindow(windowData);
                            }
                            else if (!string.IsNullOrEmpty(windowData.WindowType))
                            {
                                await UpdateWindowPosition(windowData);
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

        private static async Task CloseWindow(WindowData windowData)
        {
            try
            {
                IntPtr hWnd = (IntPtr)Convert.ToInt64(windowData.WindowType, 16);

                if (hWnd != IntPtr.Zero)
                {
                   
                    // Obtener el proceso asociado con la ventana
                    Process process = WindowComunication.GetProcessFromWindow(hWnd);
                    if (process != null)
                    {
                        try
                        {
                            WindowComunication.PostMessage(process.MainWindowHandle, WindowComunication.WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
                            process.WaitForExit(); // Esperar a que el proceso se cierre
                            process.Kill();

                        }
                        catch (Exception e)
                        {
                            Console.WriteLine($"Acceso denegado al intentar cerrar el proceso: {process.Id}");
                            // Si acceso denegado, intentar con TerminateProcess
                            TerminateProcess(process.Handle);
                        }
                    }

                    notepadWindows.Remove(hWnd);

                    Console.WriteLine($"Ventana y proceso cerrados: {windowData.WindowType}");
                }
                else
                {
                    Console.WriteLine($"Ventana no encontrada: {windowData.WindowType}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al cerrar la ventana: {ex.Message}");
            }
        }
        private static void TerminateProcess(IntPtr processHandle)
        {

            if (!WindowComunication.TerminateProcess(processHandle, 1))
            {
                Console.WriteLine($"No se pudo terminar el proceso. Código de error: {Marshal.GetLastWin32Error()}");
            }
        }


        private static async Task UpdateWindowPosition(WindowData windowData)
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

                IntPtr hWnd = (IntPtr)Convert.ToInt64(windowData.WindowType, 16);

                if (hWnd != IntPtr.Zero && notepadWindows.ContainsKey(hWnd))
                {
                    WindowComunication.SetWindowPos(hWnd, IntPtr.Zero, newRect.Left, newRect.Top, newRect.Right - newRect.Left, newRect.Bottom - newRect.Top, 0);
                    notepadWindows[hWnd] = newRect;

                    LogWindowUpdate(hWnd, newRect);
                    var position = CreatePosition(newRect, hWnd);
                    await _positionService.SavePositionAsync(position);
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

        private static async Task OpenNotepadInstances()
        {
            var maxInstances = 2;
            var notepadInstances = WindowComunication.FindOpenNotepads("Sin titulo");

            if (notepadInstances.Count >= maxInstances)
            {
                SendNotepadDataToClients();
                Console.WriteLine("Ya hay dos instancias de Notepad abiertas.");
                return;
            }

            var instancesToOpen = maxInstances - notepadInstances.Count;

            List<Position> lastPositions = await _positionService.GetLastPositionsAsync();
            lastPositions = lastPositions.OrderBy(x => x.Type).ToList();
            var positions = new[]
            {
                lastPositions.Count > 0 ? new WindowComunication.RECT
                {
                    Left = lastPositions[0].Left,
                    Top = lastPositions[0].Top,
                    Right = lastPositions[0].Right,
                    Bottom = lastPositions[0].Bottom
                } : new WindowComunication.RECT { Left = 100, Top = 100, Right = 500, Bottom = 400 },
                lastPositions.Count > 1 ? new WindowComunication.RECT
                {
                    Left = lastPositions[1].Left,
                    Top = lastPositions[1].Top,
                    Right = lastPositions[1].Right,
                    Bottom = lastPositions[1].Bottom
                } : new WindowComunication.RECT { Left = 620, Top = 100, Right = 1120, Bottom = 400 }
            };
            var openWind = WindowComunication.GetProcessByWindowTitle("Sin titulo 1");
            var index = openWind != null ? 1 : 0;
            for (var i = 0; i < instancesToOpen; i++)
            {
                var process = Process.Start("notepad.exe");

                IntPtr hWnd = IntPtr.Zero;
                while (hWnd == IntPtr.Zero)
                {
                    hWnd = process.MainWindowHandle;
                }

                WindowComunication.SetWindowText(hWnd, $"Sin titulo {index + 1}");

                if (hWnd != IntPtr.Zero)
                {
                    
                    if (WindowComunication.IsWindowVisible(hWnd))
                    {
                        var rect = positions[index];
                        WindowComunication.SetWindowPos(hWnd, IntPtr.Zero, rect.Left, rect.Top,
                            rect.Right - rect.Left, rect.Bottom - rect.Top, 0);
                        notepadWindows[hWnd] = rect;
                    }
                    else
                    {
                        notepadWindows.Remove(hWnd);
                        process.Kill();
                    }
                }
            index++;
            }
            SendNotepadDataToClients();
        }


        private static void SendNotepadDataToClients()
        {
            foreach (var notepad in notepadWindows)
            {
                var windowData = CreateWindowData(notepad.Key, new Position
                {
                    Bottom = notepad.Value.Bottom,
                    Left = notepad.Value.Left,
                    Right = notepad.Value.Right,
                    Top = notepad.Value.Top,
                });

                string jsonString = JsonSerializer.Serialize(windowData);
                var messageBytes = Encoding.UTF8.GetBytes(jsonString);
                _ = _webSocket.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        private static async Task CheckClosedNotepadInstances()
        {
            var notepadInstances = WindowComunication.FindOpenNotepads("Sin titulo");

            var windowsToRemove = new List<IntPtr>();

            foreach (var notepadWindow in notepadWindows)
            {
                if (!notepadInstances.Contains(notepadWindow.Key))
                {
                    windowsToRemove.Add(notepadWindow.Key);

                    await SendWindowClosedData(notepadWindow.Key);

                    Console.WriteLine($"Ventana cerrada detectada: {notepadWindow.Key.ToString("X")}");
                }
            }

            foreach (var hWnd in windowsToRemove)
            {
                notepadWindows.Remove(hWnd);
            }
        }
        private static async Task SendWindowClosedData(IntPtr hWnd)
        {
            var windowData = new WindowData
            {
                WindowType = hWnd.ToString("X"),
                Position = null
            };

            await SendWindowDataAsync(_webSocket, windowData);
        }

    }
}
