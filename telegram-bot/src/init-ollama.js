async function initOllama() {
  console.log("Initializing Ollama connection...");

  const ollamaHost = process.env.OLLAMA_HOST || "http://ollama:11434";
  console.log(`Connecting to: ${ollamaHost}`);

  const maxRetries = 10;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}: Checking Ollama...`);

      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Ollama connected!");

      const hasModel = data.models?.some((m) => m.name.includes("llama3.2"));

      if (hasModel) {
        console.log("✅ Model llama3.2 is ready!");
      } else {
        console.log(
          "⚠️ Model llama3.2 not found. Please run: docker exec -it ollama ollama pull llama3.2"
        );
      }

      return true;
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);

      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(
          `Failed to connect to Ollama after ${maxRetries} attempts`
        );
      }
    }
  }
}

export { initOllama };
