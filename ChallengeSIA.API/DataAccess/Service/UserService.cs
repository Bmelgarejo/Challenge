using AutoMapper;
using DataAccess.Entity.Dto;
using DataAccess.Repository.IRepository;
using DataAccess.Service.IService;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System.Data;

namespace DataAccess.Service
{
    public class UserService : IUserService
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IBaseRepository<IdentityUser> _baseRepository;
        private readonly ILogger<UserService> _logger;
        private readonly IMapper _mapper;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public UserService(UserManager<IdentityUser> userManager, IBaseRepository<IdentityUser> baseRepository,
                           ILogger<UserService> logger, IMapper mapper, IJwtTokenGenerator jwtTokenGenerator)
        {
            _userManager = userManager;
            _baseRepository = baseRepository;
            _logger = logger;
            _mapper = mapper;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<LoginResponseDto> Login(LoginRequestDto loginRequestDto)
        {
            try
            {
                IdentityUser? user = await GetUserByEmail(loginRequestDto.Email);

                bool isValid = await _userManager.CheckPasswordAsync(user, loginRequestDto.Password);

                if (user == null || isValid == false)
                {
                    return new LoginResponseDto() { User = null };
                }

                var roles = await _userManager.GetRolesAsync(user);
                var token = _jwtTokenGenerator.GenerateToken(user, roles);

                UserDto userDTO = _mapper.Map<UserDto>(user);

                LoginResponseDto loginResponseDto = new LoginResponseDto()
                {
                    User = userDTO,
                    Token = token
                };

                return loginResponseDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while logging in user with email {Email}", loginRequestDto.Email);
                return new LoginResponseDto() { User = null };
            }
        }

        public async Task<string> Register(RegistrationRequestDto registrationRequestDto)
        {
            IdentityUser user = new()
            {
                UserName = registrationRequestDto.Email,
                Email = registrationRequestDto.Email,
                NormalizedEmail = registrationRequestDto.Email.ToUpper(),
                PhoneNumber = registrationRequestDto.PhoneNumber
            };

            try
            {
                var result = await _userManager.CreateAsync(user, registrationRequestDto.Password);
                if (result.Succeeded)
                {
                    return "";
                }
                else
                {
                    return result.Errors.FirstOrDefault().Description;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while registering user with email {Email}", registrationRequestDto.Email);
                return "Error Encountered";
            }
        }

        public async Task<string> Update(UserDto userDto)
        {
            try
            {
                var user = await GetUserByEmail(userDto.Email);
                if (user == null)
                {
                    return "User not found";
                }

                user.UserName = userDto.UserName;
                user.PhoneNumber = userDto.PhoneNumber;

                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    return "Ok";
                }
                else
                {
                    return result.Errors.FirstOrDefault().Description;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating user with email {Email}", userDto.Email);
                return "Error Encountered";
            }
        }

        public async Task<string> Remove(string email)
        {
            try
            {
                var user = await GetUserByEmail(email);
                if (user == null)
                {
                    return "User not found";
                }

                var result = await _userManager.DeleteAsync(user);
                if (result.Succeeded)
                {
                    return "Ok";
                }
                else
                {
                    return result.Errors.FirstOrDefault().Description;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while removing user with email {Email}", email);
                return "Error Encountered";
            }
        }

        public async Task<IdentityUser?> GetUserByEmail(string mail)
        {
            try
            {
                return await _baseRepository.FirstOrDefault(user => user.Email == mail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching user with email {Email}", mail);
                return null;
            }
        }

        public async Task<UserDto?> GetUserDtoByEmail(string email)
        {
            try
            {
                var user = await GetUserByEmail(email);
                if (user == null)
                {
                    return null;
                }

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching user DTO with email {Email}", email);
                return null;
            }
        }

        public async Task<IEnumerable<UserDto>> GetAllUsers()
        {
            try
            {
                var users = await _baseRepository.GetAll();
                return users.Select(user => _mapper.Map<UserDto>(user)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all users");
                return Enumerable.Empty<UserDto>();
            }
        }
    }
}
