using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(MarketplaceDbContext db)
    {
        // ---- Roles ----
        var roleNames = new Dictionary<string, string>
        {
            ["Administrador"] = "Acceso total al sistema",
            ["Vendedor"] = "Puede publicar y administrar productos",
            ["Comprador"] = "Puede comprar productos"
        };

        var existingRoleNames = await db.Roles.Select(r => r.Nombre).ToListAsync();
        var newRoles = roleNames
            .Where(r => !existingRoleNames.Contains(r.Key))
            .Select(r => new Role { Nombre = r.Key, Descripcion = r.Value })
            .ToList();

        if (newRoles.Count > 0)
        {
            db.Roles.AddRange(newRoles);
            await db.SaveChangesAsync();
        }

        // ---- Usuarios de prueba (solo si la base no tiene ningún usuario) ----
        if (!await db.Usuarios.AnyAsync())
        {
            var roles = await db.Roles.ToDictionaryAsync(r => r.Nombre);
            var demoUsers = new (string Nombre, string Apellido, string Email, string Rol)[]
            {
                ("Benjamin", "Seguel", "benjamin.seguel@mercadito.cl", "Administrador"),
                ("Patricio", "Zuñiga", "patricio.zuñiga@mercadito.cl", "Vendedor"),
                ("Santiago", "Urayama", "santiago.urayama@merdacito.cl", "Comprador")
            };

            foreach (var u in demoUsers)
            {
                var usuario = new Usuario
                {
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Email = u.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo1234"),
                    FechaRegistro = DateTime.UtcNow
                };
                usuario.Rols.Add(roles[u.Rol]);
                db.Usuarios.Add(usuario);
            }

            await db.SaveChangesAsync();
        }

        var categories = new Dictionary<string, string>
        {
            ["Hogar"] = "Muebles, decoración y artículos para la casa",
            ["Ropa"] = "Prendas de vestir para todas las edades",
            ["Calzado"] = "Zapatos, zapatillas y otros complementos para los pies",
            ["Electrónica"] = "Dispositivos electrónicos y accesorios tecnológicos",
            ["Informática"] = "Ordenadores, periféricos y accesorios de informática",
            ["Deportes"] = "Material deportivo y artículos para actividades físicas",
            ["Libros"] = "Libros, novelas y material de lectura",
            ["Juguetes"] = "Juguetes, juegos de mesa y entretenimiento infantil",
            ["Belleza"] = "Cosmética, cuidado personal y perfumería",
            ["Automóviles"] = "Accesorios, repuestos y productos para vehículos"
        };

        var existingCategoryNames = await db.Categorias
            .Select(category => category.Nombre)
            .ToListAsync();

        var newCategories = categories
            .Where(category => !existingCategoryNames.Contains(category.Key))
            .Select(category => new Categoria
            {
                Nombre = category.Key,
                Descripcion = category.Value
            })
            .ToList();

        if (newCategories.Count > 0)
        {
            db.Categorias.AddRange(newCategories);
            await db.SaveChangesAsync();
        }

        var seller = await db.Usuarios
            .Include(user => user.Rols)
            .Where(user => user.Rols.Any(role => role.Nombre == "Vendedor"))
            .FirstOrDefaultAsync();

        if (seller is null)
            return;

        var categoryIds = await db.Categorias
            .ToDictionaryAsync(category => category.Nombre, category => category.CategoriaId);

        var products = new (string Name, string Category, string Description, decimal Price, int Stock, string ImageUrl)[]
        {
            ("Sofá de 3 cuerpos", "Hogar", "Sofá cómodo para sala de estar", 299990m, 5, "https://placehold.co/600x400?text=Sofa"),
            ("Polera básica negra", "Ropa", "Polera de algodón de uso diario", 14990m, 20, "https://placehold.co/600x400?text=Polera"),
            ("Zapatillas deportivas", "Calzado", "Zapatillas para entrenamiento y uso diario", 49990m, 12, "https://placehold.co/600x400?text=Zapatillas"),
            ("Auriculares Bluetooth", "Electrónica", "Auriculares inalámbricos con micrófono", 29990m, 15, "https://placehold.co/600x400?text=Auriculares"),
            ("Teclado mecánico", "Informática", "Teclado mecánico retroiluminado", 59990m, 8, "https://placehold.co/600x400?text=Teclado"),
            ("Balón de fútbol", "Deportes", "Balón de fútbol para entrenamiento", 19990m, 10, "https://placehold.co/600x400?text=Balon"),
            ("Novela de misterio", "Libros", "Novela de misterio y suspenso", 12990m, 25, "https://placehold.co/600x400?text=Libro"),
            ("Juego de mesa familiar", "Juguetes", "Juego de mesa para toda la familia", 24990m, 7, "https://placehold.co/600x400?text=Juego"),
            ("Crema hidratante", "Belleza", "Crema hidratante para uso diario", 9990m, 30, "https://placehold.co/600x400?text=Crema"),
            ("Organizador de automóvil", "Automóviles", "Organizador para maletero de automóvil", 15990m, 9, "https://placehold.co/600x400?text=Auto")
        };

        var existingProductNames = await db.Productos
            .Select(product => product.Nombre)
            .ToListAsync();

        var newProducts = products
            .Where(product => !existingProductNames.Contains(product.Name) && categoryIds.ContainsKey(product.Category))
            .Select(product => new Producto
            {
                VendedorId = seller.UsuarioId,
                CategoriaId = categoryIds[product.Category],
                Nombre = product.Name,
                Descripcion = product.Description,
                Precio = product.Price,
                Stock = product.Stock,
                ImagenUrl = product.ImageUrl,
                FechaCreacion = DateTime.UtcNow
            })
            .ToList();

        if (newProducts.Count > 0)
        {
            db.Productos.AddRange(newProducts);
            await db.SaveChangesAsync();
        }

        var buyer = await db.Usuarios
            .Include(user => user.Rols)
            .Where(user => user.Rols.Any(role => role.Nombre == "Comprador"))
            .FirstOrDefaultAsync();

        if (buyer is null || await db.Compras.AnyAsync())
            return;

        var purchaseProducts = await db.Productos
            .OrderBy(product => product.ProductoId)
            .Take(2)
            .ToListAsync();

        if (purchaseProducts.Count < 2)
            return;

        var purchase = new Compra
        {
            CompradorId = buyer.UsuarioId,
            FechaCompra = DateTime.UtcNow,
            Total = purchaseProducts[0].Precio + purchaseProducts[1].Precio,
            MetodoPago = "Tarjeta",
            EstadoPago = "Pagado",
            EstadoCompra = "Completada"
        };

        db.Compras.Add(purchase);
        await db.SaveChangesAsync();

        db.DetalleCompras.AddRange(
            new DetalleCompra
            {
                CompraId = purchase.CompraId,
                ProductoId = purchaseProducts[0].ProductoId,
                Cantidad = 1,
                PrecioUnitario = purchaseProducts[0].Precio,
                Subtotal = purchaseProducts[0].Precio
            },
            new DetalleCompra
            {
                CompraId = purchase.CompraId,
                ProductoId = purchaseProducts[1].ProductoId,
                Cantidad = 1,
                PrecioUnitario = purchaseProducts[1].Precio,
                Subtotal = purchaseProducts[1].Precio
            });

        await db.SaveChangesAsync();
    }
}
