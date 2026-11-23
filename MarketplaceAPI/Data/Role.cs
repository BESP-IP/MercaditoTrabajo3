using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

[Index("Nombre", Name = "UQ_Roles_Nombre", IsUnique = true)]
public partial class Role
{
    [Key]
    public int RolId { get; set; }

    [StringLength(50)]
    public string Nombre { get; set; } = null!;

    [StringLength(250)]
    public string? Descripcion { get; set; }

    [ForeignKey("RolId")]
    [InverseProperty("Rols")]
    [JsonIgnore]
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
