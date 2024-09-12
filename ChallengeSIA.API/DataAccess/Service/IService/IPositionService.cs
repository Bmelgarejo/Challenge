using DataAccess.Entity;

namespace DataAccess.Service.IService
{
    public interface IPositionService
    {
        Task<List<Position>> GetLastPositionsAsync();
        Task SavePositionAsync(Position position);
    }
}
