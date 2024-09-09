using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Hook
{
    public class HookDll
    {
        private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);
        private static HookProc? _hookProc; // Marcar como nullable
        private static IntPtr _hookID = IntPtr.Zero;

        private const int WH_GETMESSAGE = 3;
        private const int WM_MOVE = 0x0003;
        private const int WM_SIZE = 0x0005;

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct MSG
        {
            public IntPtr hwnd;
            public int message;
            public IntPtr wParam;
            public IntPtr lParam;
            public uint time;
            public int pt_x;
            public int pt_y;
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hHook, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll")]
        private static extern uint GetCurrentThreadId();

        public static void SetHook()
        {
            _hookProc = new HookProc(HookCallback);

            IntPtr moduleHandle = GetModuleHandle(null);
            if (moduleHandle == IntPtr.Zero)
            {
                Console.WriteLine($"Failed to get module handle. Error: {Marshal.GetLastWin32Error()}");
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "Failed to get module handle.");
            }

            Console.WriteLine($"Module handle: {moduleHandle}");

            // Usar WH_GETMESSAGE para capturar mensajes de ventana
            _hookID = SetWindowsHookEx(WH_GETMESSAGE, _hookProc, moduleHandle, 0);

            if (_hookID == IntPtr.Zero)
            {
                int errorCode = Marshal.GetLastWin32Error();
                Console.WriteLine($"Failed to set hook. Error: {errorCode}");
                throw new System.ComponentModel.Win32Exception(errorCode, "Failed to set hook.");
            }
        }

        public static void Unhook()
        {
            if (_hookID != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_hookID);
                _hookID = IntPtr.Zero;
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                var msg = Marshal.PtrToStructure<MSG>(lParam);

                if (msg.message == WM_MOVE || msg.message == WM_SIZE)
                {
                    RECT rect;
                    if (GetWindowRect(msg.hwnd, out rect))
                    {
                        Console.WriteLine($"Ventana {msg.hwnd} - Posición: ({rect.Left}, {rect.Top}) Tamaño: ({rect.Right - rect.Left}, {rect.Bottom - rect.Top})");
                    }
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}
