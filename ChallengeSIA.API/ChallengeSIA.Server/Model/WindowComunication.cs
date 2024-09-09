using System;
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
                    notepads.Add(hWnd);
                }
                return true;
            }, IntPtr.Zero);
            return notepads;
        }
    }
}
