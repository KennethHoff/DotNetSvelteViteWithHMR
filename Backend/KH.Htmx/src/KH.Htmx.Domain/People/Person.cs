using KH.Htmx.Domain.Comments;
using KH.Htmx.Domain.Primitives;
using KH.Htmx.Domain.Shared;

namespace KH.Htmx.Domain.People;

public sealed class Person : AggregateRoot
{
    public static readonly Person Admin = new()
    {
        Id = PersonId.Admin,
        Name = Name.Admin,
    };

    public PersonId Id { get; init; } = PersonId.New();
    public required Name Name { get; init; }

    public List<Comment> Comments { get; init; } = [];
}