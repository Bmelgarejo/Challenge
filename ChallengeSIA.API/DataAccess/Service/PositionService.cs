using ChallengeSIA.API.Data;
using DataAccess.Entity;
using DataAccess.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DataAccess.Service
{
    public class PositionService : IPositionService
    {
        private readonly ApplicationDbContext _context;

        public PositionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Position>> GetLastPositionsAsync()
        {
            return await _context.Positions.ToListAsync();
        }

        public async Task SavePositionAsync(Position position)
        {
            var existingPosition = await _context.Positions
                .FirstOrDefaultAsync(p => p.Type == position.Type);

            if (existingPosition != null)
            {
                existingPosition.Left = position.Left;
                existingPosition.Top = position.Top;
                existingPosition.Right = position.Right;
                existingPosition.Bottom = position.Bottom;
                _context.Positions.Update(existingPosition);
            }
            else
            {
                if(!string.IsNullOrEmpty(position.Type))
                _context.Positions.Add(position);
            }

            await _context.SaveChangesAsync();
        }

    }
}
