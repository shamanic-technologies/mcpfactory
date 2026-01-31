import Redis from 'ioredis';

const redis = new Redis('rediss://default:AfApAAIncDEyYmJiZGRjYzBjNzg0NDdmOTFlNmQ1ZDIwYzhiY2RmMHAxNjE0ODE@tender-chimp-61481.upstash.io:6379');

async function check() {
  try {
    // Get a failed job data
    const jobData = await redis.hgetall('bull:email-generate:1');
    console.log('Failed job data:');
    console.log('  failedReason:', jobData.failedReason);
    console.log('  data:', jobData.data);
    
    await redis.quit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
