using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Producto>>> GetAll() => await context.Productos.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<Producto>> Get(int id)
    {
        var entity = await context.Productos.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Vendedor")]
    public async Task<ActionResult<Producto>> Post(Producto entity)
    {
        context.Productos.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.ProductoId }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Vendedor")]
    public async Task<IActionResult> Put(int id, Producto entity)
    {
        if (id != entity.ProductoId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador,Vendedor")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Productos.FindAsync(id);
        if (entity is null) return NotFound();
        context.Productos.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
