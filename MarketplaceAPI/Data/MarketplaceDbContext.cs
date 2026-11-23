using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

public partial class MarketplaceDbContext : DbContext
{
    public MarketplaceDbContext(DbContextOptions<MarketplaceDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Categoria> Categorias { get; set; }

    public virtual DbSet<Compra> Compras { get; set; }

    public virtual DbSet<DetalleCompra> DetalleCompras { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Compra>(entity =>
        {
            entity.Property(e => e.FechaCompra).HasDefaultValueSql("(sysutcdatetime())", "DF_Compras_FechaCompra");

            entity.HasOne(d => d.Comprador).WithMany(p => p.Compras)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Compras_Comprador");
        });

        modelBuilder.Entity<DetalleCompra>(entity =>
        {
            entity.HasOne(d => d.Compra).WithMany(p => p.DetalleCompras)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetalleCompra_Compras");

            entity.HasOne(d => d.Producto).WithMany(p => p.DetalleCompras)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetalleCompra_Productos");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(sysutcdatetime())", "DF_Productos_FechaCreacion");

            entity.HasOne(d => d.Categoria).WithMany(p => p.Productos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Productos_Categoria");

            entity.HasOne(d => d.Vendedor).WithMany(p => p.Productos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Productos_Vendedor");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.Property(e => e.FechaRegistro).HasDefaultValueSql("(sysutcdatetime())", "DF_Usuarios_FechaRegistro");

            entity.HasMany(d => d.Rols).WithMany(p => p.Usuarios)
                .UsingEntity<Dictionary<string, object>>(
                    "UsuarioRol",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RolId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_UsuarioRol_Roles"),
                    l => l.HasOne<Usuario>().WithMany()
                        .HasForeignKey("UsuarioId")
                        .HasConstraintName("FK_UsuarioRol_Usuarios"),
                    j =>
                    {
                        j.HasKey("UsuarioId", "RolId");
                        j.ToTable("UsuarioRol");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
