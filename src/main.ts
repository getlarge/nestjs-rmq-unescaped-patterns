import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'test_queue',
        wildcards: true, // Enable wildcard patterns
        queueOptions: {
          durable: false,
        },
      },
    },
  );

  await app.listen();
  console.log('🚀 Microservice is listening with wildcards enabled');
  console.log('📝 Registered patterns:');
  console.log('   - $internal.plugin.*.status (wildcard with $)');
  console.log('   - $internal.plugin.0.status (exact match)');
  console.log('   - internal.plugin.*.status (wildcard without $)');
}

void bootstrap();
