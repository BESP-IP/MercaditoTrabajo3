using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

[Index("CategoriaId", Name = "IX_Productos_CategoriaId")]
[Index("Nombre", Name = "IX_Productos_Nombre")]
[Index("VendedorId", Name = "IX_Productos_VendedorId")]
public partial class Producto
{
    [Key]
    public int ProductoId { get; set; }

    public int VendedorId { get; set; }

    public int CategoriaId { get; set; }

    [StringLength(150)]
    public string Nombre { get; set; } = null!;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Precio { get; set; }

    public int Stock { get; set; }

    [StringLength(500)]
    public string? ImagenUrl { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("CategoriaId")]
    [InverseProperty("Productos")]
    [JsonIgnore]
    public virtual Categoria Categoria { get; set; } = null!;

    [InverseProperty("Producto")]
    [JsonIgnore]
    public virtual ICollection<DetalleCompra> DetalleCompras { get; set; } = new List<DetalleCompra>();

    [ForeignKey("VendedorId")]
    [InverseProperty("Productos")]
    [JsonIgnore]
    public virtual Usuario Vendedor { get; set; } = null!;
}
