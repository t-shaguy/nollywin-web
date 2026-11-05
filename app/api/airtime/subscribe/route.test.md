# Airtime Subscribe Route - Test Scenarios

## Test Setup

Mock the following:
- `process.env.NEXT_PUBLIC_API_URL` → test backend URL
- `AIRTIME_API_URL` → mock upstream endpoint
- `fetch` calls to packages API and upstream

## Test Cases

### 1. Valid UUID String Works (200)

**Input:**
```json
{
  "packageId": "5cd11df0-2917-4b71-8073-956a7d4f53d3",
  "msisdn": "+2348036533888"
}
```

**Mocked Responses:**
- Packages API returns: `[{ id: "5cd11df0-2917-4b71-8073-956a7d4f53d3", name: "Daily", ... }]`
- Upstream returns: `{ secureDurl: "http://mtn.example.com", subTransId: "TXN123", tid: 456 }`

**Expected:** 200 OK
```json
{
  "redirectUrl": "http://mtn.example.com",
  "transactionId": "TXN123",
  "tid": 456
}
```

### 2. "NaN" String Gives 400

**Input:**
```json
{
  "packageId": "NaN",
  "msisdn": "+2348036533888"
}
```

**Expected:** 400 Bad Request
```json
{
  "message": "Invalid request"
}
```

**Reason:** packageId validation catches "NaN" string explicitly

### 3. Unknown UUID Gives 404

**Input:**
```json
{
  "packageId": "00000000-0000-0000-0000-000000000000",
  "msisdn": "+2348036533888"
}
```

**Mocked Responses:**
- Packages API returns: `[{ id: "5cd11df0-2917-4b71-8073-956a7d4f53d3", name: "Daily" }]` (different ID)

**Expected:** 404 Not Found
```json
{
  "message": "Plan not found"
}
```

### 4. Empty packageId Gives 400

**Input:**
```json
{
  "packageId": "",
  "msisdn": "+2348036533888"
}
```

**Expected:** 400 Bad Request
```json
{
  "message": "Invalid request"
}
```

### 5. Invalid Phone Number Gives 400

**Input:**
```json
{
  "packageId": "5cd11df0-2917-4b71-8073-956a7d4f53d3",
  "msisdn": "12345"
}
```

**Expected:** 400 Bad Request
```json
{
  "message": "<validation error from validateNigerianPhone>"
}
```

### 6. No Authorization Header Gives 401

**Input:** Valid payload but no `Authorization` header

**Expected:** 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 7. Upstream Network Error Gives 502

**Input:** Valid payload

**Mocked Responses:**
- Packages API returns: valid package
- Upstream throws network error

**Expected:** 502 Bad Gateway
```json
{
  "message": "Airtime payment is temporarily unavailable"
}
```

### 8. Upstream Returns 500 Gives 502

**Input:** Valid payload

**Mocked Responses:**
- Packages API returns: valid package
- Upstream returns: 500 Internal Server Error

**Expected:** 502 Bad Gateway
```json
{
  "message": "Airtime payment is temporarily unavailable"
}
```

### 9. Weekly Package (Disabled) Gives 400

**Input:**
```json
{
  "packageId": "<weekly-package-uuid>",
  "msisdn": "+2348036533888"
}
```

**Mocked Responses:**
- Packages API returns: `[{ id: "<weekly-package-uuid>", name: "Weekly" }]`
- `NEXT_PUBLIC_AIRTIME_WEEKLY_ENABLED=false` (environment)

**Expected:** 400 Bad Request
```json
{
  "message": "This payment method is not yet available for this plan"
}
```

## Implementation Notes

1. **Never call real upstream in tests** - Mock all fetch calls
2. **Test bad input → 4xx, server errors → 5xx** - This is the key contract
3. **Verify logging** - Check that dev logs show packageId validation failures
4. **Phone validation** - Uses existing `validateNigerianPhone()` function

## Manual Testing

To test manually in development:

### Valid Request
```bash
curl -X POST http://localhost:3000/api/airtime/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"5cd11df0-2917-4b71-8073-956a7d4f53d3","msisdn":"+2349160572310"}'
```

### NaN Request
```bash
curl -X POST http://localhost:3000/api/airtime/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"NaN","msisdn":"+2349160572310"}'
```

Expected: `400 {"message":"Invalid request"}`

### Unknown UUID
```bash
curl -X POST http://localhost:3000/api/airtime/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"00000000-0000-0000-0000-000000000000","msisdn":"+2349160572310"}'
```

Expected: `404 {"message":"Plan not found"}`
