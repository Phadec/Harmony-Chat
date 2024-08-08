using ChatAppServer.WebAPI.Hubs;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:4200") // Ensure this is the correct Angular app URL
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")));

// Register Background Task Queue
builder.Services.AddSingleton<IBackgroundTaskQueue>(_ => new BackgroundTaskQueue(100));
builder.Services.AddHostedService<QueuedHostedService>();

// Register ExpiredPendingUserCleanupService
builder.Services.AddHostedService<ExpiredPendingUserCleanupService>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                context.NoResult();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "text/plain";
                return context.Response.WriteAsync(context.Exception.ToString());
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                if (!context.Response.HasStarted)
                {
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    var result = JsonSerializer.Serialize(new { error = "You are not authorized" });
                    return context.Response.WriteAsync(result);
                }
                return Task.CompletedTask;
            },
            OnForbidden = context =>
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new { error = "You are not authorized to access this resource" });
                return context.Response.WriteAsync(result);
            },
            OnTokenValidated = context =>
            {
                var claims = context.Principal?.Claims;
                if (claims != null)
                {
                    foreach (var claim in claims)
                    {
                        Console.WriteLine($"Claim Type: {claim.Type}, Claim Value: {claim.Value}");
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ChatApp API", Version = "v1" });

    // Configure Swagger to use the JWT bearer token authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please insert JWT with Bearer into field",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
    {
        new OpenApiSecurityScheme {
            Reference = new OpenApiReference {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            },
            Scheme = "oauth2",
            Name = "Bearer",
            In = ParameterLocation.Header
        },
        new List<string>()
    }});
});

builder.Services.AddSignalR();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    ApplicationDbContext.SeedData(services);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ChatApp API v1");
        c.RoutePrefix = "swagger"; // Ensure c.RoutePrefix is "swagger" to access /swagger/index.html
    });
}

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication(); // Add authentication middleware
app.UseAuthorization();

app.MapControllers();

app.MapHub<ChatHub>("/chat-hub");
app.MapHub<CallHub>("/call-hub"); // Add this line to map the CallHub

app.Run();
