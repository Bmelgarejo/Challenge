using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace ChallengeSIA.Server.Model
{
    public static class WindowComunication
    {
        // Estructura RECT para manejar las coordenadas y dimensiones de las ventanas
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        private const uint PROCESS_QUERY_INFORMATION = 0x0400;
        private const uint PROCESS_VM_READ = 0x0010;

        // Definición de EnumWindows callback
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        // Importar EnumWindows para obtener todas las ventanas
        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        // Obtener el nombre de la clase de una ventana
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        // Obtener el rectángulo que representa el tamaño y la posición de la ventana
        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        // Mover la ventana a una nueva posición
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        // Mostrar o restaurar la ventana
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        // Cambiar el título de la ventana
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern bool SetWindowText(IntPtr hWnd, string lpString);

        // Obtener el texto de la ventana
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        // Enviar un mensaje a una ventana
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        // Publicar un mensaje a una ventana
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        // Definir los mensajes de ventana
        public const uint WM_CLOSE = 0x0010;

        // Buscar una ventana por su título o clase
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsWindowVisible(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern IntPtr GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("kernel32.dll")]
        public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);

        [DllImport("kernel32.dll")]
        public static extern bool CloseHandle(IntPtr hObject);
        public static Process GetProcessFromWindow(IntPtr hWnd)
        {
            int processId;
            GetWindowThreadProcessId(hWnd, out processId);
            return Process.GetProcessById(processId);
        }

        // Método para buscar Notepads abiertos
        public static List<IntPtr> FindOpenNotepads(string windowTitle)
        {
            List<IntPtr> notepads = new List<IntPtr>();
            EnumWindows((hWnd, lParam) =>
            {
                StringBuilder className = new StringBuilder(256);
                GetClassName(hWnd, className, className.Capacity);

                if (className.ToString().Contains("Notepad"))
                {
                    // Verificar el título de la ventana
                    StringBuilder windowText = new StringBuilder(256);
                    GetWindowText(hWnd, windowText, windowText.Capacity);

                    if (windowText.ToString().Contains(windowTitle))
                    {
                        notepads.Add(hWnd);
                    }
                }
                return true;
            }, IntPtr.Zero);
            return notepads;
        }

        public static Process GetProcessByWindowTitle(string title)
        {
            // Encuentra la ventana por su título
            IntPtr hWnd = FindWindow(null, title);
            if (hWnd == IntPtr.Zero)
            {
                Console.WriteLine("No se encontró la ventana con el título especificado.");
                return null;
            }

            // Obtiene el identificador del proceso
            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);

            if (processId == 0)
            {
                Console.WriteLine("No se pudo obtener el identificador del proceso.");
                return null;
            }

            // Abre el proceso
            IntPtr processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, processId);

            if (processHandle == IntPtr.Zero)
            {
                Console.WriteLine("No se pudo abrir el proceso.");
                return null;
            }

            try
            {
                // Obtiene el proceso
                return Process.GetProcessById((int)processId);
            }
            finally
            {
                // Cierra el handle del proceso
                CloseHandle(processHandle);
            }
        }
    }
}

