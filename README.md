# NestJS RabbitMQ Wildcard Pattern Bug Reproduction

This repository demonstrates a bug in NestJS microservices where RabbitMQ wildcard patterns containing the `$` character fail to match due to improper regex escaping.

## Bug Description

When using wildcard patterns like `$internal.plugin.*.status`, the `$` character is not escaped when converting the pattern to a regex, causing it to be interpreted as an end-of-string anchor instead of a literal character.

## Steps to Reproduce

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start RabbitMQ:**
   ```bash
   docker compose up -d
   ```

3. **In one terminal, start the microservice:**
   ```bash
   npm run start
   ```

4. **In another terminal, run the client tests:**
   ```bash
   npm run start:client
   ```

## Expected vs Actual Behavior

### Expected:
- Messages sent to `$internal.plugin.0.status` should match the wildcard pattern `$internal.plugin.*.status`
- Messages sent to `$internal.plugin.123.status` should match the wildcard pattern `$internal.plugin.*.status`

### Actual:
- Wildcard patterns containing `$` fail to match any messages
- Only exact pattern matches work for patterns with `$`
- Wildcard patterns without `$` work correctly (proving the wildcard feature itself works)

## Root Cause

In `@nestjs/microservices/server/server-rmq.js`, the `convertRoutingKeyToRegex` method doesn't escape the `$` character:

```javascript
convertRoutingKeyToRegex(routingKey) {
    let regexPattern = routingKey
        .replace(/\\/g, '\\\\')
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^.]+')
        .replace(/#/g, '.*');
    // Missing: .replace(/\$/g, '\\$')
    return new RegExp(`^${regexPattern}$`);
}
```

This creates a regex like `/^$internal\.plugin\.[^.]+\.status$/` where the unescaped `$` after `^` creates an impossible pattern.

## Proposed Fix

Add escaping for the `$` character:

```javascript
convertRoutingKeyToRegex(routingKey) {
    let regexPattern = routingKey
        .replace(/\$/g, '\\$')  // Add this line
        .replace(/\\/g, '\\\\')
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^.]+')
        .replace(/#/g, '.*');
    return new RegExp(`^${regexPattern}$`);
}
```

## Test Output

When running the reproduction, you'll see:

**Microservice output:**
- ✅ EXACT: Exact match handler received (Test 2)
- ✅ CONTROL: Handler without $ received (Test 4)
- ❌ Missing: Wildcard handler calls for Tests 1 & 3

**Client output:**
- Shows all 4 tests being sent
- Explains expected vs actual behavior

## Environment

- NestJS: 11.1.2
- Node.js: Any version
- RabbitMQ: 3.x
