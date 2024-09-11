# ChallengeSIA

Este proyecto consiste en una aplicación web desarrollada en Angular que se conecta a un backend en .NET a través de WebSockets. La aplicación permite gestionar instancias de Notepad.exe, reflejando su posición y tamaño en la interfaz de usuario y sincronizando estos datos con el servidor.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Requisitos](#requisitos)
- [Guía de Instalación](#guía-de-instalación)
- [Uso](#uso)
- [Documentación de la API](#documentación-de-la-api)
- [Notas](#notas)
- [Enlaces](#enlaces)

## Descripción

El sistema está compuesto por dos partes principales:

1. **Backend (Servidor WebSocket en .NET):** Maneja la creación, monitoreo y gestión de instancias de Notepad.exe, así como la sincronización de posiciones y tamaños de ventanas. Utiliza WebSocket para comunicarse con la aplicación web Angular.

2. **Frontend (Aplicación Angular):** Proporciona una interfaz de usuario para visualizar y manipular las instancias de Notepad.exe. Permite mover, redimensionar y cerrar las ventanas, reflejando estos cambios en el servidor.

### Funcionalidades Clave

- **Gestión de Ventanas:** Inicia y gestiona hasta dos instancias de Notepad.exe.
- **Sincronización de Datos:** Sincroniza la posición y tamaño de las ventanas entre el cliente y el servidor.
- **Interfaz de Usuario:** Visualiza y permite manipular las instancias de Notepad.exe a través de la interfaz web.
- **Persistencia de Datos:** Guarda la posición y tamaño de las ventanas para restaurarlas al reiniciar.

## Requisitos

- **Backend:**
  - .NET 8
  - SQL Express
  - WebSocket
  - Win32 APIs

- **Frontend:**
  - Angular CLI: 11.1.4
  - Node: 10.24.1

## Guía de Instalación

### Backend

1. Clona el repositorio del backend:

    ```bash
    git clone (https://github.com/Bmelgarejo/Challenge.git)
    ```

2. Navega al directorio del backend:

    ```bash
    cd ChallengeSIA.Server
    ```

3. Restaura las dependencias:

    ```bash
    dotnet restore
    ```

4. Ejecuta las migraciones de la base de datos:

    ```bash
    dotnet ef database update
    ```

5. Inicia el servidor:

    ```bash
    dotnet run
    ```

### Frontend

1. Clona el repositorio del frontend:

    ```bash
    git clone (https://github.com/Bmelgarejo/Challenge.git)
    ```

2. Navega al directorio del frontend:

    ```bash
    cd ChallengeSIA.Angular
    ```

3. Instala las dependencias:

    ```bash
    npm install
    ```

4. Ejecuta la aplicación Angular:

    ```bash
    ng serve
    ```

5. Abre tu navegador y visita `http://localhost:4200` para ver la aplicación en acción.

## Uso

1. **Iniciar el Servidor WebSocket:** Asegúrate de que el servidor backend esté en ejecución.
2. **Acceder a la Aplicación Web:** Visita la aplicación Angular en `http://localhost:4200`.
3. **Login:** Realiza el login para empezar a gestionar las instancias de Notepad.
4. **Interacción:** Utiliza la interfaz para mover, redimensionar y cerrar las ventanas de Notepad. Los cambios se reflejarán en la interfaz y se sincronizarán con el servidor.

## Documentación de la API

La API de usuarios está documentada utilizando Swagger. Puedes acceder a la documentación Swagger en `http://localhost:7161/swagger/index.html`.

### Endpoints de la API

#### Gestión de Usuarios

- **Login**
  - **URL:** `https://localhost:7161/api/user/login`
  - **Método:** POST
  - **Descripción:** Inicia sesión y obtiene un token JWT.

- **Register**
  - **URL:** `https://localhost:7161/api/user/register`
  - **Método:** POST
  - **Descripción:** Registra un nuevo usuario.

- **Update User**
  - **URL:** `https://localhost:7161/api/user/update`
  - **Método:** PUT
  - **Descripción:** Actualiza la información de un usuario existente.
  - **Headers:** `Authorization: Bearer <token>`

- **Remove User**
  - **URL:** `https://localhost:7161/api/user/remove/{email}`
  - **Método:** DELETE
  - **Descripción:** Elimina un usuario por email.
  - **Headers:** `Authorization: Bearer <token>`

- **Get User by Email**
  - **URL:** `https://localhost:7161/api/user?email={email}`
  - **Método:** GET
  - **Descripción:** Obtiene la información de un usuario por email.
  - **Headers:** `Authorization: Bearer <token>`

- **Get All Users**
  - **URL:** `https://localhost:7161/api/user/getAll`
  - **Método:** GET
  - **Descripción:** Obtiene la lista de todos los usuarios.
  - **Headers:** `Authorization: Bearer <token>`

## Diagramas de Secuencia

### Diagrama de Secuencia de la API

 ![image](https://github.com/user-attachments/assets/8601f798-f3b8-4d82-80e1-748454ebdc26)


### Diagrama de Secuencia del Servidor

![image](https://github.com/user-attachments/assets/7a23c7df-b2c6-478b-9543-774d152284f2)

## Notas

- Asegúrate de que el puerto `7161` esté disponible para la API.
- Asegúrate de que el puerto `5000` esté disponible para el servidor WebSocket.
- La aplicación Angular debe estar en ejecución en el puerto `4200`.
- La API está protegida por JWT, por lo que es necesario autenticar las solicitudes para acceder a la mayoría de los endpoints.

## Enlaces

- [Repositorio del Backend](https://github.com/Bmelgarejo/Challenge.git)
- [Repositorio del Frontend](https://github.com/Bmelgarejo/Challenge.git)
- [Documentación Swagger](http://localhost:7161/swagger/index.html)
- [WebSocket](http://localhost:5000/ws/)
