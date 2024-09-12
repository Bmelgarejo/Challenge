using AutoMapper;
using DataAccess.Entity.Dto;
using Microsoft.AspNetCore.Identity;

namespace DataAccess.Entity.Dto.Util
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<IdentityUser, UserDto>().ReverseMap();
        }
    }
}
