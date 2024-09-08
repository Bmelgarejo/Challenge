using ChallengeSIA.API.Dto;
using ChallengeSIA.Services.IServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ChallengeSIA.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        protected ResponseDto _response;

        public UserController(IUserService userService)
        {
            _userService = userService;
            _response = new();
        }

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
                    return BadRequest(_response);
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
                    return BadRequest(_response);
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
                    return BadRequest(_response);
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
                    return BadRequest(_response);
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
                    return BadRequest(_response);
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
