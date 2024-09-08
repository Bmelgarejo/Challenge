using ChallengeSIA.API.Data;
using ChallengeSIA.API.Repository.IRepository;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ChallengeSIA.API.Repository
{
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        private readonly ApplicationDbContext _context;
        internal DbSet<T> dbSet;

        public BaseRepository(ApplicationDbContext context)
        {
            _context = context;
            dbSet = _context.Set<T>();
        }

        public async Task<T?> GetById(int id) => await dbSet.FindAsync(id);

        public Task<T?> FirstOrDefault(Expression<Func<T, bool>> predicate) => dbSet.FirstOrDefaultAsync(predicate);

        public T Add(T entity)
        {
            dbSet.Add(entity);
            return entity;
        }

        public void Update(T entity)
        {
            _context.Entry(entity).State = EntityState.Modified;
        }

        public void Remove(T entity)
        {
            _context.Entry(entity).State = EntityState.Deleted;
        }

        public async Task<IEnumerable<T>> GetAll() => await dbSet.ToListAsync();

        public async Task<IEnumerable<T>> GetWhere(Expression<Func<T, bool>> predicate) => await dbSet.Where(predicate).ToListAsync();

    }
}
