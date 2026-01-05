import { parseExpenseWithLLM } from './llm.js';

// Test cases
const testMessages = [
  "Received salary £3900",
  "Spent £4.5 at Sainsbury's",
  "Earned £500 freelance work",
  "Bought petrol 45",
  "Add 50 Tesco",
  "Transferred 300 to savings",
  "Got £200 cashback",
  "Paid rent 1200",
];

// Models to test
export const AVAILABLE_MODELS = {
  'gemini-2.0-flash-lite': 'google/gemini-2.0-flash-lite:free',
  'gemini-1.5-flash': 'google/gemini-1.5-flash:free',
  'deepseek-r1': 'deepseek/deepseek-r1-0528:free',
  'llama-3.2-3b': 'meta-llama/llama-3.2-3b-instruct:free',
  'qwen-32b': 'qwen/qwen-2.5-32b-instruct:free'
};

async function testLLM(testMessage) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing: "${testMessage}"`);
  console.log('='.repeat(80));
  
  try {
    const result = await parseExpenseWithLLM(testMessage);
    if (result) {
      console.log('✅ SUCCESS:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ FAILED: Got null result');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function runTests() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📋 USAGE:\n');
    console.log('Test single message:');
    console.log('  node src/test-llm.js "Received salary £3900"\n');
    console.log('Test all messages:');
    console.log('  node src/test-llm.js --all\n');
    console.log('List available models:');
    console.log('  node src/test-llm.js --models\n');
    console.log('Switch model (edit llm.js MODEL constant):');
    console.log('  node src/test-llm.js --switch gemini-2.0-flash-lite\n');
    return;
  }

  if (args[0] === '--models') {
    console.log('\n📦 Available models on OpenRouter (free tier):\n');
    Object.entries(AVAILABLE_MODELS).forEach(([name, model]) => {
      console.log(`  • ${name}`);
      console.log(`    ${model}\n`);
    });
    return;
  }

  if (args[0] === '--all') {
    console.log('\n🧪 Running all tests...\n');
    for (const msg of testMessages) {
      await testLLM(msg);
    }
    console.log('\n✅ All tests completed\n');
    return;
  }

  if (args[0] === '--switch') {
    if (!args[1]) {
      console.log('❌ Please specify a model: node src/test-llm.js --switch gemini-2.0-flash-lite');
      console.log('\nAvailable models:', Object.keys(AVAILABLE_MODELS).join(', '));
      return;
    }
    
    const modelName = args[1];
    const modelPath = AVAILABLE_MODELS[modelName];
    
    if (!modelPath) {
      console.log(`❌ Model not found: ${modelName}`);
      console.log('Available models:', Object.keys(AVAILABLE_MODELS).join(', '));
      return;
    }
    
    console.log(`\n⚠️  To switch to ${modelName}:`);
    console.log(`Edit llm.js and change:`);
    console.log(`  const MODEL = '${modelPath}';\n`);
    return;
  }

  // Test single message
  await testLLM(args.join(' '));
}

runTests().catch(console.error);
