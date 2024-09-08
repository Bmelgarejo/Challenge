using AutoMapper;
using Microsoft.AspNetCore.Identity;

namespace ChallengeSIA.API.Dto.Util
{
    public class AutoMapperProfiles: Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<IdentityUser, UserDto>().ReverseMap();
        }
    }
}
