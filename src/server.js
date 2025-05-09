import app from "./app.js";
import "dotenv/config";

const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ Erro: A variável de ambiente PORT não está definida.");
  process.exit(1); 
}

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta: ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Erro não tratado:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promessa rejeitada não tratada:", reason);
});
