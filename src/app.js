import express, { response } from 'express';
import axios from 'axios';
import { Mistral } from '@mistralai/mistralai';
import "dotenv/config"

import fs from 'fs';
const app = express();



app.use(express.json());

app.post("/",async(req, res) => {
    const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });
    console.log("começou");

   const teste = await axios.get(req.body.url,{responseType: 'arraybuffer'})
   const blob = new Blob([teste.data]);
   console.log("0")

   const uploadedFile = await client.files.upload({
    file: {
      fileName: 'documento.pdf',
      content: blob,
    },
    purpose: 'ocr',
  });
  console.log("0.1")


  const signedUrlResponse = await client.files.getSignedUrl({
    fileId: uploadedFile.id,
  });

  const prompt = `
  Você está recebendo como entrada o conteúdo completo de um PDF de uma fatura médica com várias guias de atendimento (Consultas ou Exames), incluindo uma capa de lote com informações complementares.
  
  ### Tarefa:
  
  Para cada Guia de Consulta/Exame/Serviço nas páginas do PDF, extraia os seguintes campos, utilizando a capa de lote (geralmente na última página) como apoio quando necessário:
  
  - **Número da Guia**:
    - Extraia do campo "2- No Guia no Prestador" ou "Guia" na capa de lote.
    
  - **Tipo de Atendimento**:
    - Se for uma consulta, retorne "Consulta".
    - Se for um exame, retorne "Exame".
    - Utilize o campo "Especialidade:" da guia ou "Serviço" na capa de lote para inferir.
  
  - **Procedimento**:
    - Para consultas, extraia a **Especialidade** no campo "Especialidade:".
    - Para exames, extraia o **Exame** no mesmo campo ou similar.
    - Corrija erros de OCR, como "Especialdade" para "Especialidade", "S $\diamond$ O" para "SÃO".
    - Se não for possível identificar, retorne "não foi possível identificar".
  
  - **Código do Procedimento**:
    - Extraia do campo "21- Código do Procedimento", apenas os números.
    - Se ausente, retorne "não foi possível analisar".
  
  - **Número de Registro ANS**:
    - Extraia o valor do campo "1- Registro ANS".
    - Retorne o valor ou "não foi possível analisar".
  
  - **Carimbo**:
    - Verifique se há carimbo no campo "24- Assinatura do Profissional Executante".
    - Retorne "presente", "ausente" ou "não foi possível analisar".
  
  - **Data do Atendimento**:
    - Extraia do campo "18- Data do Atendimento".
    - Retorne a data no formato "DD/MM/AAAA" ou "não foi possível analisar".
  
  - **Data de Emissão da Guia**:
    - Extraia a data de emissão (campo de data próximo à autorização ou no cabeçalho da guia).
    - Retorne no formato "DD/MM/AAAA" ou "não foi possível analisar".
  
  - **Nome do Paciente**:
    - Extraia do campo "7- Nome" da guia ou da capa de lote.
    - Retorne o nome ou "não foi possível analisar".
  
  - **Valor Cobrado**:
    - Extraia do campo "22- Valor do Procedimento", "Valor Aproximado" na capa de lote ou "VALOR DA GUIA".
    - Normalize o valor para número (ex.: R$ 100,00 → 100.00).
    - Se não for possível identificar, retorne "não foi possível analisar".
  
  - **Código CBO**:
    - Extraia do campo "16- Código CBO".
    - Retorne o código ou "não foi possível analisar".
  
  - **Pedido Médico** (somente para exames):
    - Verifique se há pedido médico na guia.
    - Retorne "presente", "ausente" ou "não foi possível analisar".
    - Este campo deve ser omitido para consultas.
  
  ### Exemplo de Saída Esperado:
  {
    "sucesso": true,
    "dados": [
      {
        "guiaNumero": "253312",
        "tipoAtendimento": "Consulta",
        "procedimento": "Dermatologia",
        "codigoProcedimento": "10101012",
        "registroANS": "423173",
        "carimboAssinatura": "ausente",
        "dataAtendimento": "27/01/2025",
        "dataEmissao": "26/01/2025",
        "nomePaciente": "Vanessa Del Valle Lima",
        "valorCobrado": 100.00,
        "codigoCBO": "225115"
      },
      {
        "guiaNumero": "253313",
        "tipoAtendimento": "Exame",
        "procedimento": "Hemograma",
        "codigoProcedimento": "20102020",
        "registroANS": "423173",
        "carimboAssinatura": "presente",
        "dataAtendimento": "28/01/2025",
        "dataEmissao": "27/01/2025",
        "nomePaciente": "Carlos Andrade",
        "valorCobrado": 80.00,
        "codigoCBO": "225103",
        "pedidoMedico": "presente"
      }
    ]
  }
  Retorne **apenas o JSON completo**, sem comentários ou marcações.
  `;

  const chatResponse = await client.chat.complete({
    model: 'pixtral-large-latest',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'document_url', documentUrl: signedUrlResponse.url },
        ],
      },
    ],
  });

  const responseJson = chatResponse.choices[0].message.content;
  console.log(responseJson)

//    const buffer = Buffer.from(teste.data);
//    await fs.writeFile("pdf.pdf", buffer, ()=>{
//     console.log("escreveu");
//    });
//    console.log("PDF salvo em ");
    res.status(200).json({data:responseJson})
})

export default app;