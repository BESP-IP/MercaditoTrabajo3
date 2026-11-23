using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Vendedor,Comprador")]
public class ComprasController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Compra>>> GetAll() => await context.Compras.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Compra>> Get(int id)
    {
        var entity = await context.Compras.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    public async Task<ActionResult<Compra>> Post(Compra entity)
    {
        context.Compras.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.CompraId }, entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, Compra entity)
    {
        if (id != entity.CompraId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Compras.FindAsync(id);
        if (entity is null) return NotFound();
        context.Compras.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
