import { createSampleSales } from './create-sample-sales';

async function main() {
  try {
    await createSampleSales();
    process.exit(0)
  } catch (error) {
    console.error('Creating sample sales failed:', error);
    process.exit(1)
  }
}

main();