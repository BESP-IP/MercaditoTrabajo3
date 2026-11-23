using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

[Index("CompradorId", "FechaCompra", Name = "IX_Compras_Comprador_Fecha")]
public partial class Compra
{
    [Key]
    public int CompraId { get; set; }

    public int CompradorId { get; set; }

    public DateTime FechaCompra { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Total { get; set; }

    [StringLength(30)]
    public string MetodoPago { get; set; } = null!;

    [StringLength(30)]
    public string EstadoPago { get; set; } = null!;

    [StringLength(30)]
    public string EstadoCompra { get; set; } = null!;

    [ForeignKey("CompradorId")]
    [InverseProperty("Compras")]
    [JsonIgnore]
    public virtual Usuario Comprador { get; set; } = null!;

    [InverseProperty("Compra")]
    [JsonIgnore]
    public virtual ICollection<DetalleCompra> DetalleCompras { get; set; } = new List<DetalleCompra>();
}
