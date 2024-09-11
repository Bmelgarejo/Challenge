using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Service.IService
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(IdentityUser applicationUser, IEnumerable<string> roles);
    }
}
