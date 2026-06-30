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

// Quantos participantes cabem por página antes de quebrar
const PARTIC_POR_PAGINA = 8;

function mkParagraph(text: string): string {
  return `<w:p><w:pPr><w:rPr/></w:pPr><w:r><w:rPr><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function patchXml(xml: string): string {
  // 1. Preencher campo PAG com variáveis de página
  xml = xml.replace("___/___", "{pag_atual}/{total_paginas}");

  // 2. Renomear loop interno para o escopo de paginas
  xml = xml.replace(/{#participantes}/g, "{#participantes_pagina}");
  xml = xml.replace(/{\/participantes}/g, "{/participantes_pagina}");

  // 3. Localizar Tabela 2 (conteúdo principal: PAG + itens + participantes)
  const firstTblEnd = xml.indexOf("</w:tbl>") + 8;
  const tbl2Start   = xml.indexOf("<w:tbl>", firstTblEnd);
  const tbl2End     = xml.indexOf("</w:tbl>", tbl2Start) + 8;

  // 4. Montar os parágrafos de controle do loop
  const pageBreakPara =
    `<w:p><w:pPr><w:rPr/></w:pPr>` +
    `<w:r><w:rPr><w:rtl w:val="0"/></w:rPr><w:br w:type="page"/></w:r></w:p>`;

  const before = mkParagraph("{#paginas}");
  const after  =
    mkParagraph("{#page_break}") +
    pageBreakPara +
    mkParagraph("{/page_break}") +
    mkParagraph("{/paginas}");

  // 5. Reconstituir o XML envolvendo a Tabela 2 no loop
  return (
    xml.slice(0, tbl2Start) +
    before +
    xml.slice(tbl2Start, tbl2End) +
    after +
    xml.slice(tbl2End)
  );
}

export function gerarListaPresenca(dados: DadosLista): Buffer {
  const zip = new PizZip(fs.readFileSync(TEMPLATE, "binary"));

  // Patchar o XML do template em memória (nunca toca o arquivo em disco)
  zip.file("word/document.xml", patchXml(zip.file("word/document.xml")!.asText()));

  const imageModule = new ImageModule({
    centered: false,
    fileType: "docx",
    getImage: (tagValue: string) => {
      if (!tagValue) return Buffer.alloc(0);
      const base64 = tagValue.includes(",") ? tagValue.split(",")[1] : tagValue;
      return Buffer.from(base64, "base64");
    },
    getSize: () => [150, 50],
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  const totalPaginas = Math.max(1, Math.ceil(dados.participantes.length / PARTIC_POR_PAGINA));

  const paginas = Array.from({ length: totalPaginas }, (_, i) => ({
    pag_atual:    String(i + 1).padStart(2, "0"),
    total_paginas: String(totalPaginas).padStart(2, "0"),
    local:            dados.local            || "",
    data:             dados.data             || "",
    nome_treinamento: dados.nome_treinamento || "",
    instrutor:        dados.instrutor        || "",
    carga_horaria:    dados.carga_horaria    || "",
    participantes_pagina: dados.participantes
      .slice(i * PARTIC_POR_PAGINA, (i + 1) * PARTIC_POR_PAGINA)
      .map((p) => ({
        nome:       p.nome      || "",
        funcao:     p.funcao    || "",
        empresa:    p.empresa   || "",
        assinatura: p.assinatura || "",
      })),
    page_break: i < totalPaginas - 1, // true em todas exceto a última
  }));

  doc.render({ paginas });

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
