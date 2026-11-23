using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class RolesController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Role>>> GetAll() => await context.Roles.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Role>> Get(int id)
    {
        var entity = await context.Roles.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    public async Task<ActionResult<Role>> Post(Role entity)
    {
        context.Roles.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.RolId }, entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, Role entity)
    {
        if (id != entity.RolId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Roles.FindAsync(id);
        if (entity is null) return NotFound();
        context.Roles.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
