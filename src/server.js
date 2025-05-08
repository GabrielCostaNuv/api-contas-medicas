import app from "./app.js";
import "dotenv/config";

app.listen(process.env.PORT, () => {
  console.log(`Rodando na porta: ${process.env.PORT}`);
});
