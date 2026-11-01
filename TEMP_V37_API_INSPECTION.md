# V37 API Response Inspection

This file contains temporary logging code to inspect v37 API responses.
Will be removed after confirming field names.

## Add these console.logs temporarily:

### 1. Dashboard (app/(authenticated)/home/page.tsx)
```typescript
if (dashboard) {
  console.log("[V37 DASHBOARD]", JSON.stringify(dashboard, null, 2));
}
```

### 2. Active Draws (app/(authenticated)/raffles/page.tsx or store)
```typescript
console.log("[V37 ACTIVE DRAWS]", JSON.stringify(response, null, 2));
```

### 3. History (app/features/raffles/presentation/raffle-history-list.tsx)
```typescript
console.log("[V37 HISTORY]", JSON.stringify(response, null, 2));
```

### 4. Admin Draws List (app/admin/rewards/page.tsx)
```typescript
console.log("[V37 ADMIN DRAWS]", JSON.stringify(response, null, 2));
```

### 5. Admin Draw Detail
```typescript
console.log("[V37 ADMIN DRAW DETAIL]", JSON.stringify(response, null, 2));
```

### 6. Admin Standings
```typescript
console.log("[V37 ADMIN STANDINGS]", JSON.stringify(response, null, 2));
```

### 7. Admin Winners
```typescript
console.log("[V37 ADMIN WINNERS]", JSON.stringify(response, null, 2));
```
