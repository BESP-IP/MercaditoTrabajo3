using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController(MarketplaceDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetAll() => await context.Usuarios.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Usuario>> Get(int id)
    {
        var entity = await context.Usuarios.FindAsync(id);
        return entity is null ? NotFound() : entity;
    }

    [HttpPost]
    public async Task<ActionResult<Usuario>> Post(Usuario entity)
    {
        context.Usuarios.Add(entity);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = entity.UsuarioId }, entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, Usuario entity)
    {
        if (id != entity.UsuarioId) return BadRequest();
        context.Entry(entity).State = EntityState.Modified;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Usuarios.FindAsync(id);
        if (entity is null) return NotFound();
        context.Usuarios.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{usuarioId:int}/roles")]
    public async Task<ActionResult<IEnumerable<Role>>> GetRoles(int usuarioId)
    {
        var usuario = await context.Usuarios
            .Include(u => u.Rols)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UsuarioId == usuarioId);

        return usuario is null ? NotFound() : usuario.Rols.ToList();
    }

    [HttpPost("{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> AssignRole(int usuarioId, int rolId)
    {
        var usuario = await context.Usuarios
            .Include(u => u.Rols)
            .FirstOrDefaultAsync(u => u.UsuarioId == usuarioId);
        var rol = await context.Roles.FindAsync(rolId);

        if (usuario is null || rol is null) return NotFound();

        if (usuario.Rols.All(existingRole => existingRole.RolId != rolId))
        {
            usuario.Rols.Add(rol);
            await context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> RemoveRole(int usuarioId, int rolId)
    {
        var usuario = await context.Usuarios
            .Include(u => u.Rols)
            .FirstOrDefaultAsync(u => u.UsuarioId == usuarioId);

        if (usuario is null) return NotFound();

        var rol = usuario.Rols.FirstOrDefault(existingRole => existingRole.RolId == rolId);
        if (rol is null) return NotFound();

        usuario.Rols.Remove(rol);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
