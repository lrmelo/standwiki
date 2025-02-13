// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import OpenAI from "openai";
import { readFile } from 'fs/promises';

const data = await readFile('./prompts.json', 'utf-8');
const Prompts = JSON.parse(data);
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Conecta ao MongoDB (as opções antigas foram removidas pois já são padrão)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Define o esquema e modelo para armazenar os títulos e conteúdos
const wikiPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const WikiPage = mongoose.model("WikiPage", wikiPageSchema);

app.use(cors());
app.use(express.json());

// Inicializa a instância da OpenAI utilizando a nova sintaxe
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Endpoint para gerar um mini resumo usando a API do ChatGPT
 * e salvar o título e conteúdo extraído da página no banco de dados.
 */
app.post("/api/summary", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "O título e o conteúdo são obrigatórios." });
  }

  // Salva título e conteúdo no banco de dados
  try {
    const newPage = new WikiPage({ title, content });
    await newPage.save();
    console.log("Título e conteúdo salvos:", title);
  } catch (err) {
    console.error("Erro ao salvar no banco de dados:", err);
    // Mesmo que ocorra erro no salvamento, podemos seguir com a geração do resumo
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ou outro modelo conforme sua necessidade
      store: true,
      messages: [
        { role: "system", content: Prompts.POWER_SYSTEM },
        { role: "user", content: content }
      ],
    });
    const gptData = completion.choices[0].message.content;
    const cleanedgptData = gptData.replace(/``` ?json|```/g, "").trim();

    const { Poder_de_Destruição, Velocidade, Alcance, Resistência, Precisão, Potencial_de_Desenvolvimento  } = JSON.parse(cleanedgptData);
    res.json({ Poder_de_Destruição, Velocidade, Alcance, Resistência, Precisão, Potencial_de_Desenvolvimento });
  } catch (error) {
    console.error("Erro ao chamar a API da OpenAI:", error);
    res.status(500).json({ error: "Erro ao obter resumo da OpenAI" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
