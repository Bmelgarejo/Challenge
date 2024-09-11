using DataAccess.Entity.Dto;
using DataAccess.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChallengeSIA.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ResponseDto _response;

        public UserController(IUserService userService)
        {
            _userService = userService;
            _response = new();
        }

        /// <summary>
        /// Inicia sesión en el sistema.
        /// </summary>
        /// <param name="model">Modelo de solicitud de inicio de sesión.</param>
        /// <returns>Token de acceso y datos del usuario si el inicio de sesión es exitoso.</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
        {
            try
            {
                var loginResponse = await _userService.Login(model);
                _response.Result = loginResponse;
                if (loginResponse.User == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Usuario o Contraseña incorrecto.";
                }
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }

        /// <summary>
        /// Registra un nuevo usuario en el sistema.
        /// </summary>
        /// <param name="model">Datos del usuario a registrar.</param>
        /// <returns>Resultado de la operación de registro.</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegistrationRequestDto model)
        {
            try
            {
                var errorMessage = await _userService.Register(model);
                if (!string.IsNullOrEmpty(errorMessage))
                {
                    _response.IsSuccess = false;
                    _response.Message = errorMessage;
                }
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }

        /// <summary>
        /// Actualiza los datos de un usuario existente.
        /// </summary>
        /// <param name="userDto">Datos actualizados del usuario.</param>
        /// <returns>Resultado de la operación de actualización.</returns>
        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult> Update([FromBody] UserDto userDto)
        {
            try
            {
                var errorMessage = await _userService.Update(userDto);
                if (!string.IsNullOrEmpty(errorMessage))
                {
                    _response.IsSuccess = false;
                    _response.Message = errorMessage;
                }
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }

        /// <summary>
        /// Elimina un usuario por su dirección de correo electrónico.
        /// </summary>
        /// <param name="email">Correo electrónico del usuario a eliminar.</param>
        /// <returns>Resultado de la operación de eliminación.</returns>
        [Authorize]
        [HttpDelete("remove/{email}")]
        public async Task<IActionResult> Remove(string email)
        {
            try
            {
                var errorMessage = await _userService.Remove(email);
                if (!string.IsNullOrEmpty(errorMessage))
                {
                    _response.IsSuccess = false;
                    _response.Message = errorMessage;
                }
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }

        /// <summary>
        /// Obtiene los datos de un usuario por su dirección de correo electrónico.
        /// </summary>
        /// <param name="email">Correo electrónico del usuario a obtener.</param>
        /// <returns>Datos del usuario.</returns>
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get(string email)
        {
            try
            {
                var userResponseDto = await _userService.GetUserDtoByEmail(email);
                _response.UserResult = userResponseDto;
                if (userResponseDto == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Usuario no encontrado";
                }
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }

        /// <summary>
        /// Obtiene todos los usuarios del sistema.
        /// </summary>
        /// <returns>Lista de todos los usuarios.</returns>
        [Authorize]
        [HttpGet("getAll")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var usersResponseDto = await _userService.GetAllUsers();
                _response.UsersResult = usersResponseDto.ToList();
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, _response);
            }
        }
    }
}
