using FluentValidation;
using KHtmx.Components.Comments;
using KHtmx.Domain.Comments;
using KHtmx.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KHtmx.Comments;

public static class CommentsEndpointExtensions
{
    public const string CommentsEndpoint = "/comments";

    public static IServiceCollection AddComments(this IServiceCollection services)
    {
        return services;
    }

    public static void MapComments(this IEndpointRouteBuilder route)
    {
        route.MapPost(CommentsEndpoint, AddCommentEndPointHandler)
            .WithName("AddComment");

        route.MapDelete(CommentsEndpoint + "/{id}", DeleteCommentEndPointHandler)
            .WithName("DeleteComment");

        route.MapGet(CommentsEndpoint, GetCommentsTableEndpointHandler)
            .WithName("GetCommentsTable");

        route.MapGet(CommentsEndpoint + "/{id}", GetCommentDialogEndpointHandler)
            .WithName("GetCommentDialog");

        route.MapGet(CommentsEndpoint + "/{id}/edit", GetCommentEditFormEndPointHandler)
            .WithName("GetCommentEditForm");

        route.MapPatch(CommentsEndpoint + "/{id}", UpdateCommentEndPointHandler)
            .WithName("UpdateComment");
    }

    private static async ValueTask<RazorComponentResult<CreateCommentForm>> AddCommentEndPointHandler
    (
        IValidator<CreateCommentFormDto> validator,
        IDbContextFactory<KhDbContext> dbContextFactory,
        [FromForm] CreateCommentFormDto dto,
        CancellationToken ct
    )
    {
        if (await validator.ValidateAsync(dto, ct) is { IsValid: false } validationResult)
        {
            return new RazorComponentResult<CreateCommentForm>(new
            {
                Comment = dto,
                Errors = validationResult.Errors.Select(x => x.ErrorMessage).ToArray(),
            });
        }
        await using var dbContext = await dbContextFactory.CreateDbContextAsync(ct);

        // TODO: Use CQRS instead, and use the current user
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.UserName == "admin", ct)
            ?? throw new InvalidOperationException("Admin user not found");

        DateTimeOffset timestamp = TimeProvider.System.GetUtcNow();
        var entity = Comment.Create(dto.Text, timestamp, user.Id);

        dbContext.Add(entity);
        await dbContext.SaveChangesAsync(ct);

        return new RazorComponentResult<CreateCommentForm>(new
        {
            Comment = dto with
            {
                Text = string.Empty,
            },
        });
    }

    private static async ValueTask<Results<NotFound, NoContent>> DeleteCommentEndPointHandler
    (
        IDbContextFactory<KhDbContext> dbContextFactory,
        Guid id,
        CancellationToken ct
    )
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync(ct);
        if (await dbContext.Comments.FindAsync(id) is not { } entity)
        {
            return TypedResults.NotFound();
        }

        dbContext.Remove(entity);
        await dbContext.SaveChangesAsync(ct);

        return TypedResults.NoContent();
    }

    private static RazorComponentResult<CommentTable> GetCommentsTableEndpointHandler
        ()
    {
        return new RazorComponentResult<CommentTable>();
    }

    private static RazorComponentResult<CommentDialog> GetCommentDialogEndpointHandler
        (Guid id)
    {
        return new RazorComponentResult<CommentDialog>(new
        {
            Id = id
        });
    }

    private static async ValueTask<Results<NotFound, RazorComponentResult<EditCommentForm>>> GetCommentEditFormEndPointHandler
    (
        IDbContextFactory<KhDbContext> dbContextFactory,
        Guid id,
        CancellationToken ct
    )
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync(ct);
        if (await dbContext.Comments.FirstOrDefaultAsync(x => x.Id == id, ct) is not { } entity)
        {
            return TypedResults.NotFound();
        }

        var dto = EditCommentFormDto.FromCommentEntity(entity);

        return new RazorComponentResult<EditCommentForm>(new
        {
            Comment = dto,
        });
    }

    private static async ValueTask<Results<NotFound, RazorComponentResult<EditCommentForm>, Ok>> UpdateCommentEndPointHandler
    (
        IValidator<EditCommentFormDto> validator,
        IDbContextFactory<KhDbContext> dbContextFactory,
        Guid id,
        [FromForm] EditCommentFormDto dto,
        CancellationToken ct)
    {
        if (await validator.ValidateAsync(dto, ct) is { IsValid: false } validationResult)
        {
            return new RazorComponentResult<EditCommentForm>(new
            {
                Comment = dto,
                Errors = validationResult.Errors.Select(x => x.ErrorMessage).ToArray(),
            });
        }

        await using var dbContext = await dbContextFactory.CreateDbContextAsync(ct);
        if (await dbContext.Comments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken: ct) is not { } entity)
        {
            return TypedResults.NotFound();
        }

        entity.ChangeText(dto.Text);

        await dbContext.SaveChangesAsync(ct);

        return TypedResults.Ok();
    }
}
