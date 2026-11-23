using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Categoria>>> GetAll() => await context.Categorias.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<Categoria>> Get(int id)
    {
        var entity = await context.Categorias.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<Categoria>> Post(Categoria entity)
    {
        context.Categorias.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.CategoriaId }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Put(int id, Categoria entity)
    {
        if (id != entity.CategoriaId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Categorias.FindAsync(id);
        if (entity is null) return NotFound();
        context.Categorias.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
