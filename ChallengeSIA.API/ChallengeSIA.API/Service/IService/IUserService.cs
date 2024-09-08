using ChallengeSIA.API.Dto;

namespace ChallengeSIA.Services.IServices
{
    public interface IUserService
    {
        Task<LoginResponseDto> Login(LoginRequestDto loginRequestDto);
        Task<string> Register(RegistrationRequestDto registrationRequestDto);
        Task<string> Update(UserDto userDto);
        Task<string> Remove(string email);
        Task<UserDto> GetUserDtoByEmail(string email);
        Task<IEnumerable<UserDto>> GetAllUsers();
    }
}
