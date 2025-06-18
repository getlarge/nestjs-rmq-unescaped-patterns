import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

async function runTests() {
  const client: ClientProxy = ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'test_queue',
      queueOptions: {
        durable: false,
      },
      wildcards: true,
    },
  });

  await client.connect();
  console.log('🔌 Client connected to RabbitMQ\n');

  console.log('Running tests...\n');

  // Test 1: Pattern with $ that should match wildcard (BUG - won't work)
  console.log(
    'Test 1: Sending to "$internal.plugin.0.status" (should match wildcard)',
  );
  client.emit('$internal.plugin.0.status', {
    test: 1,
    description: 'Should trigger wildcard handler but will fail due to bug',
  });
  await sleep(1000);

  // Test 2: Exact match (will work)
  console.log(
    '\nTest 2: Sending to "$internal.plugin.0.status" (exact match exists)',
  );
  client.emit('$internal.plugin.0.status', {
    test: 2,
    description: 'Will trigger exact match handler',
  });
  await sleep(1000);

  // Test 3: Different plugin ID that should match wildcard (BUG - won't work)
  console.log(
    '\nTest 3: Sending to "$internal.plugin.123.status" (should match wildcard)',
  );
  client.emit('$internal.plugin.123.status', {
    test: 3,
    description: 'Should trigger wildcard handler but will fail due to bug',
  });
  await sleep(1000);

  // Test 4: Control test without $ (will work)
  console.log(
    '\nTest 4: Sending to "internal.plugin.456.status" (control without $)',
  );
  client.emit('internal.plugin.456.status', {
    test: 4,
    description:
      'Will trigger wildcard handler - proves wildcards work without $',
  });
  await sleep(1000);

  console.log('\n❌ Expected bug behavior:');
  console.log(
    "   - Test 1 & 3 should trigger wildcard handler but won't due to unescaped $",
  );
  console.log('   - Test 2 works only because exact match exists');
  console.log('   - Test 4 works, proving wildcards function without $');

  await client.close();
  process.exit(0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

runTests().catch(console.error);
