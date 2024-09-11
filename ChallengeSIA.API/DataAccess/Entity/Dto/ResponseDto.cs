namespace DataAccess.Entity.Dto
{
    public class ResponseDto
    {
        public LoginResponseDto? Result { get; set; }
        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = "";
        public virtual UserDto UserResult { get; set; }
        public List<UserDto> UsersResult { get; set; }
    }
}
