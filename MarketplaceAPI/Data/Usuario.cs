using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

[Index("Email", Name = "UQ_Usuarios_Email", IsUnique = true)]
public partial class Usuario
{
    [Key]
    public int UsuarioId { get; set; }

    [StringLength(100)]
    public string Nombre { get; set; } = null!;

    [StringLength(100)]
    public string Apellido { get; set; } = null!;

    [StringLength(254)]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    public string PasswordHash { get; set; } = null!;

    public DateTime FechaRegistro { get; set; }

    [InverseProperty("Comprador")]
    [JsonIgnore]
    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();

    [InverseProperty("Vendedor")]
    [JsonIgnore]
    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("Usuarios")]
    [JsonIgnore]
    public virtual ICollection<Role> Rols { get; set; } = new List<Role>();
}
