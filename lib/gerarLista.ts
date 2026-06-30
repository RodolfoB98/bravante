import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// @ts-expect-error — módulo sem tipos
import ImageModule from "docxtemplater-image";

export type Participante = {
  nome: string;
  funcao: string;
  empresa: string;
  assinatura: string; // data URL (base64) do PNG, ou ""
};

export type DadosLista = {
  local: string;
  data: string; // dd/mm/aaaa
  nome_treinamento: string;
  instrutor: string;
  carga_horaria: string;
  participantes: Participante[];
};

const TEMPLATE = path.join(process.cwd(), "lib", "templates", "lista_presenca.docx");

export function gerarListaPresenca(dados: DadosLista): Buffer {
  const content = fs.readFileSync(TEMPLATE, "binary");
  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: false,
    fileType: "docx",
    getImage: (tagValue: string) => {
      if (!tagValue) return Buffer.alloc(0);
      const base64 = tagValue.includes(",") ? tagValue.split(",")[1] : tagValue;
      return Buffer.from(base64, "base64");
    },
    getSize: () => [150, 50], // largura x altura (px) da assinatura na célula
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render({
    local: dados.local || "",
    data: dados.data || "",
    nome_treinamento: dados.nome_treinamento || "",
    instrutor: dados.instrutor || "",
    carga_horaria: dados.carga_horaria || "",
    participantes: dados.participantes.map((p) => ({
      nome: p.nome || "",
      funcao: p.funcao || "",
      empresa: p.empresa || "",
      assinatura: p.assinatura || "",
    })),
  });

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
