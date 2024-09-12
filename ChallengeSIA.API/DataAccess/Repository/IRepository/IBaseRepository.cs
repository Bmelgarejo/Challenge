using System.Linq.Expressions;

namespace DataAccess.Repository.IRepository
{
    public interface IBaseRepository<T> where T : class
    {
        Task<T?> GetById(int id);

        Task<T?> FirstOrDefault(Expression<Func<T, bool>> predicate);

        T Add(T entity);

        void Update(T entity);

        void Remove(T entity);

        Task<IEnumerable<T>> GetAll();

        Task<IEnumerable<T>> GetWhere(Expression<Func<T, bool>> predicate);

    }
}
