using System.ComponentModel.DataAnnotations;

namespace DataAccess.Entity
{
    public class Position
    {
        [Key]
        public int Id { get; set; }
        public int Left { get; set; }
        public int Top { get; set; }
        public int Right { get; set; }
        public int Bottom { get; set; }
        public string Type { get; set; }
    }
}
