using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Vendedor,Comprador")]
public class DetallesCompraController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DetalleCompra>>> GetAll() => await context.DetalleCompras.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DetalleCompra>> Get(int id)
    {
        var entity = await context.DetalleCompras.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    public async Task<ActionResult<DetalleCompra>> Post(DetalleCompra entity)
    {
        context.DetalleCompras.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.DetalleCompraId }, entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, DetalleCompra entity)
    {
        if (id != entity.DetalleCompraId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.DetalleCompras.FindAsync(id);
        if (entity is null) return NotFound();
        context.DetalleCompras.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
