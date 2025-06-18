import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  // This handler will NOT be triggered due to the bug
  @EventPattern('$internal.plugin.*.status')
  handleWildcardPattern(data: any) {
    console.log('✅ SUCCESS: Wildcard handler received:', data);
    return { received: true, handler: 'wildcard' };
  }

  // This exact match handler WILL work
  @EventPattern('$internal.plugin.0.status')
  handleExactPattern(data: any) {
    console.log('✅ EXACT: Exact match handler received:', data);
    return { received: true, handler: 'exact' };
  }

  // Control test without $ character - this WILL work
  @EventPattern('internal.plugin.*.status')
  handleWildcardWithoutDollar(data: any) {
    console.log('✅ CONTROL: Handler without $ received:', data);
    return { received: true, handler: 'no-dollar' };
  }
}
