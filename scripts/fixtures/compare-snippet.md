## Zarządzanie sesjami uwierzytelniania

### Pobranie listy aktywnych sesji uwierzytelniania

Zwraca listę aktywnych sesji uwierzytelnienia powiązanych z bieżącym kontekstem. Wynik jest stronicowany — kolejne strony pobiera się przy użyciu tokenu kontynuacji zwróconego w poprzedniej odpowiedzi.

GET [/auth/sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Aktywne-sesje/paths/~1auth~1sessions/get)

Przykład w języku `C#`:

```csharp
const int pageSize = 20;
string continuationToken = string.Empty;
List<AuthenticationListItem> authenticationListItems = [];
```

### Unieważnienie bieżącej sesji

Unieważnia bieżącą sesję uwierzytelnienia powiązaną z tokenem, z którego wykonano żądanie. Po unieważnieniu token dostępu (`accessToken`) oraz token odświeżania (`refreshToken`) przestają być ważne i nie można ich dalej używać do wywoływania metod API.
