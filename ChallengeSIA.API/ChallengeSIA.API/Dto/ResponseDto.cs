
namespace ChallengeSIA.API.Dto
{
    public class ResponseDto
    {
        public LoginResponseDto? Result { get; set; }
        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = "";
        public UserDto UserResult { get; internal set; }
        public List<UserDto> UsersResult { get; internal set; }
    }
}
