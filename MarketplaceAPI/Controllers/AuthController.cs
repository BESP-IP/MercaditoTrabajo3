using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MarketplaceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(MarketplaceDbContext context, IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await context.Usuarios.AnyAsync(u => u.Email == request.Email))
            return Conflict("El correo ya está registrado.");

        var usuario = new Usuario
        {
            Nombre = request.Nombre,
            Apellido = request.Apellido,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FechaRegistro = DateTime.UtcNow
        };

        var comprador = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Comprador");
        if (comprador is not null)
            usuario.Rols.Add(comprador);

        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(Register), new { id = usuario.UsuarioId }, new
        {
            usuario.UsuarioId,
            usuario.Nombre,
            usuario.Apellido,
            usuario.Email,
            Roles = usuario.Rols.Select(r => r.Nombre)
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var usuario = await context.Usuarios
            .Include(u => u.Rols)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            return Unauthorized("Correo o contraseña incorrectos.");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.UsuarioId.ToString()),
            new(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
            new(ClaimTypes.Name, usuario.Email)
        };

        claims.AddRange(usuario.Rols.Select(role => new Claim(ClaimTypes.Role, role.Nombre)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(configuration.GetValue("Jwt:ExpiresMinutes", 120));
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return Ok(new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expires,
            UsuarioId = usuario.UsuarioId,
            Nombre = usuario.Nombre,
            Roles = usuario.Rols.Select(r => r.Nombre).ToList()
        });
    }
}

public sealed class RegisterRequest
{
    public string Nombre { get; set; } = null!;
    public string Apellido { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed class AuthResponse
{
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = null!;
    public List<string> Roles { get; set; } = [];
}
