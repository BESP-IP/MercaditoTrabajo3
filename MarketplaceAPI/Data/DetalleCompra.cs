using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

[Table("DetalleCompra")]
[Index("ProductoId", Name = "IX_DetalleCompra_ProductoId")]
[Index("CompraId", "ProductoId", Name = "UQ_DetalleCompra_Compra_Producto", IsUnique = true)]
public partial class DetalleCompra
{
    [Key]
    public int DetalleCompraId { get; set; }

    public int CompraId { get; set; }

    public int ProductoId { get; set; }

    public int Cantidad { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Subtotal { get; set; }

    [ForeignKey("CompraId")]
    [InverseProperty("DetalleCompras")]
    [JsonIgnore]
    public virtual Compra Compra { get; set; } = null!;

    [ForeignKey("ProductoId")]
    [InverseProperty("DetalleCompras")]
    [JsonIgnore]
    public virtual Producto Producto { get; set; } = null!;
}
