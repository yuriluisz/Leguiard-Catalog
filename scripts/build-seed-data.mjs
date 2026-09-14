import fs from "fs";

// 1. Read apply-descriptions.mjs to get DESCRIPTIONS object
const applyDescContent = fs.readFileSync("scripts/apply-descriptions.mjs", "utf-8");

// Extract DESCRIPTIONS object by evaluating a safe extraction
const startDesc = applyDescContent.indexOf("const DESCRIPTIONS = {");
const endDesc = applyDescContent.indexOf("};", startDesc);
const descSnippet = applyDescContent.slice(startDesc, endDesc + 2);

const sandbox = {};
const fn = new Function(descSnippet + "\nreturn DESCRIPTIONS;");
const DESCRIPTIONS = fn();

console.log("Loaded descriptions:", Object.keys(DESCRIPTIONS).length);

// 2. Exact 12 Categories and their products from line 261
const CATEGORY_PRODUCTS = {
  "Farinhas": [
    { name: "Açafrão Cúrcuma", price: 4.50 },
    { name: "Bicarbonato de Sódio", price: 2.20 },
    { name: "Cacau em Pó", price: 6.90 },
    { name: "Canela em Pó", price: 5.50 },
    { name: "Catuaba em Pó", price: 4.90 },
    { name: "Coco Ralado Médio", price: 4.20 },
    { name: "Extrato de Soja Baunilha", price: 3.80 },
    { name: "Farelo de Aveia", price: 2.20 },
    { name: "Farinha de Amêndoa", price: 9.80 },
    { name: "Farinha de Aveia", price: 2.40 },
    { name: "Farinha de Banana Verde", price: 3.90 },
    { name: "Farinha de Batata", price: 3.50 },
    { name: "Farinha de Beterraba", price: 4.80 },
    { name: "Farinha de Coco", price: 3.90 },
    { name: "Farinha de Linhaça", price: 2.50 },
    { name: "Farinha de Maca Peruana", price: 7.90 },
    { name: "Farinha de Uva Preta", price: 4.50 },
    { name: "Feno Grego em Pó", price: 3.90 },
    { name: "Gelatina em Pó", price: 5.50 },
    { name: "Gengibre em Pó Puro", price: 5.80 },
    { name: "Germe de Trigo", price: 2.80 },
    { name: "Ginseng em Pó", price: 8.90 },
    { name: "Goma Xantana", price: 8.50 },
    { name: "Guaraná em Pó", price: 6.20 },
    { name: "Laranja Moro (Pó)", price: 8.50 },
    { name: "Marapuama em Pó", price: 5.20 },
    { name: "Moringa Oleifera em Pó", price: 7.50 },
    { name: "Pimenta Calabresa", price: 4.80 },
    { name: "Proteína da Soja Isolada", price: 6.90 },
    { name: "Proteína de Soja Graúda", price: 3.20 },
    { name: "Psyllium Husk", price: 8.90 },
    { name: "Shot Cúrcuma", price: 7.50 },
    { name: "Temp. Pega Marido", price: 4.80 },
    { name: "Tríbulos Terrestris", price: 9.20 }
  ],
  "Açúcares": [
    { name: "Açúcar Demerara", price: 1.80 }
  ],
  "Adoçante": [
    { name: "Xilitol", price: 6.90 }
  ],
  "Chás": [
    { name: "Alecrim em Flocos", price: 3.80 },
    { name: "Aniz Estrelado", price: 8.90 },
    { name: "Camomila em Flor", price: 6.50 },
    { name: "Canela em Pau", price: 7.80 },
    { name: "Carqueja Amarga", price: 3.90 },
    { name: "Chá Capim Cidreira", price: 4.20 },
    { name: "Chá de Alcachofra", price: 5.20 },
    { name: "Chá de Cana do Brejo", price: 4.50 },
    { name: "Chá de Cavalinha", price: 4.80 },
    { name: "Chá de Centella Asiatica", price: 5.50 },
    { name: "Chá de Guaco", price: 4.90 },
    { name: "Chá Dente de Leão", price: 5.80 },
    { name: "Chá de Passiflora", price: 5.20 },
    { name: "Chá de Quebra Pedra", price: 4.50 },
    { name: "Chá de Salvia", price: 5.90 },
    { name: "Chá Pau Tenente", price: 4.20 },
    { name: "Chá verde Talos e Folhas", price: 4.80 },
    { name: "Cravo em Flor", price: 8.50 },
    { name: "Erva Cidreira", price: 4.50 },
    { name: "Erva doce em Grãos", price: 4.20 },
    { name: "Espinheira Santa Chá", price: 6.90 },
    { name: "Flor de Hibisco", price: 5.80 },
    { name: "Flor Fada Azul", price: 12.90 },
    { name: "Ginko Biloba em Pó", price: 7.20 },
    { name: "Ginko Biloba Folhas", price: 6.80 },
    { name: "Hibisco em Pó", price: 6.20 },
    { name: "Lavanda", price: 9.50 },
    { name: "Matcha em Pó Gengibre", price: 8.90 },
    { name: "Mulungu", price: 6.50 },
    { name: "Picão Preto", price: 3.90 }
  ],
  "Temperos": [
    { name: "Alho em Pó", price: 4.20 },
    { name: "Alho Granulado", price: 4.50 },
    { name: "Cebola em Pó", price: 3.90 },
    { name: "Chimichurri com Pimenta", price: 4.80 },
    { name: "Chimichurri sem Pimenta", price: 4.80 },
    { name: "Colorau", price: 2.50 },
    { name: "Flor de Sal", price: 5.50 },
    { name: "Folha de Louro", price: 6.20 },
    { name: "Lemon Pepper", price: 4.90 },
    { name: "Orange Pepper", price: 5.20 },
    { name: "Orégano Turco", price: 5.50 },
    { name: "Tempero de Feijão", price: 4.50 },
    { name: "Tempero Edu Guedes", price: 4.80 },
    { name: "Vinagrete em Flocos", price: 4.80 }
  ],
  "Desidratados": [
    { name: "Ameixa sem Caroço", price: 4.80 },
    { name: "Banana Desidratada", price: 4.50 },
    { name: "Chips de Coco", price: 6.90 },
    { name: "Cramberry", price: 6.80 },
    { name: "Damasco", price: 7.90 },
    { name: "Kiwi Desidratado", price: 6.50 },
    { name: "Morango Desidratado", price: 8.50 },
    { name: "Tamara Jumbo", price: 6.90 },
    { name: "Uva Passa Preta", price: 2.80 }
  ],
  "Castanha": [
    { name: "Amêndoa", price: 8.50 },
    { name: "Amêndoa Defumada Salgada", price: 8.90 },
    { name: "Amendoim", price: 2.60 },
    { name: "Amendoim com Pimenta", price: 2.90 },
    { name: "Castanha de Caju", price: 8.90 },
    { name: "Castanha de Caju Caramelizada", price: 9.50 },
    { name: "Castanha do Pará", price: 9.20 },
    { name: "Mix de Castanhas", price: 8.90 },
    { name: "Nozes Quartz", price: 9.80 }
  ],
  "Encapsulados": [
    { name: "Amora Miúra", price: 32.00 },
    { name: "Ashwagandha", price: 45.00 },
    { name: "Bela Beauty Fortalecedor (60 caps)", price: 38.00 },
    { name: "Bela Beauty Fortalecedor (120 caps)", price: 65.00 },
    { name: "Biotina", price: 28.00 },
    { name: "Biotina Gummy Hair", price: 39.00 },
    { name: "Cabelo, Pele e Unha", price: 35.00 },
    { name: "Cardo Mariano", price: 36.00 },
    { name: "Castanha da Índia", price: 29.00 },
    { name: "Cloreto de Magnésio P.A com Sucupira", price: 32.00 },
    { name: "Dente de Leão", price: 30.00 },
    { name: "Erva Baleeira", price: 34.00 },
    { name: "Espinheira Santa", price: 29.00 },
    { name: "Ginko Biloba", price: 32.00 },
    { name: "Levedo de Cerveja", price: 26.00 },
    { name: "Maca Peruana Negra", price: 42.00 },
    { name: "Magnésio di Malato", price: 38.00 },
    { name: "Natu Cúrcuma", price: 35.00 },
    { name: "Óleo de Abacate", price: 32.00 },
    { name: "Óleo de Alho", price: 28.00 },
    { name: "Ora Pro Nobris", price: 34.00 },
    { name: "Seca Barriga + Colágeno", price: 38.00 },
    { name: "Seca Barriga Detox", price: 38.00 },
    { name: "Spirulina", price: 35.00 },
    { name: "SSB ( Super Seca Barriga )", price: 42.00 },
    { name: "Sucupira Composta", price: 32.00 },
    { name: "Suplemento Alimentar", price: 29.00 },
    { name: "Uxi Amarelo e Unha de Gato", price: 36.00 },
    { name: "Vitamina K2", price: 39.00 }
  ],
  "Extrato": [
    { name: "Chá Amargo", price: 22.00 },
    { name: "Extrato de Própolis", price: 18.00 },
    { name: "Óleo de Semente de Abóbora", price: 35.00 }
  ],
  "Suplementos": [
    { name: "Colágeno Hidrolisado", price: 48.00 },
    { name: "Creatina em Pó", price: 65.00 },
    { name: "Glutamina em Pó", price: 58.00 },
    {
      name: "Vitalis Energy",
      price: 97.00,
      isPinned: true,
      description: "Vitalis Energy - Fórmula exclusiva premium para disposição física, clareza mental e vitalidade duradoura.\nCombinação potente de bioativos naturais que aceleram o metabolismo e revitalizam seu dia a dia.\nConsumir conforme indicação do rótulo para máxima absorção e performance diária.",
      imageUrl: "https://prod-minio.aifsu7.easypanel.host/img/Vitalis%20Energy%201%20unidade%20Corrigido.png"
    }
  ],
  "Sementes": [
    { name: "Feno Grego", price: 3.50 },
    { name: "Gergelim Branco", price: 2.80 },
    { name: "Gergelim Preto", price: 3.50 },
    { name: "Linhaça", price: 2.00 },
    { name: "Milho Espanhol", price: 3.20 },
    { name: "Quinua Branca", price: 4.50 },
    { name: "Quinua Mix", price: 5.20 },
    { name: "Semente Chias Hispa", price: 3.80 },
    { name: "Semente de Abóbora", price: 5.50 },
    { name: "Semente de Girassol", price: 3.20 },
    {
      name: "Granola Gourmet",
      price: 4.50,
      description: "Granola Gourmet com Uvas Passas, Cereal, e Chips de Coco.\nPerfeita para começar o dia com energia, fibras saudáveis e crocância irresistível.\nIdeal para acompanhar açaí, iogurtes, frutas picadas e sobremesas saudáveis."
    },
    {
      name: "Mix de Sementes",
      price: 4.80,
      description: "Semente de abobora, semente de girassol, gergelim branco e preto, Linhaça, Castanha de Caju.\nMix completo riquíssimo em minerais essenciais, ômega vegetal e gorduras de alta qualidade.\nConsuma puro como snack funcional ou salpique sobre saladas e refeições principais."
    }
  ],
  "Mel": [
    {
      name: "Mel Silvestre",
      price: 45.00,
      description: "Mel Silvestre 1,4Kg puro de abelhas nativas, colhido artesanalmente.\nFonte natural de energia rápida, enzimas antioxidantes e propriedades antibacterianas.\nIdeal para adoçar sucos, chás, receitas caseiras ou consumir 1 colher ao dia."
    }
  ]
};

function normalize(str) {
  return (str || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDesc(name, customDesc) {
  if (customDesc) return customDesc;
  const normName = normalize(name);

  for (const [k, d] of Object.entries(DESCRIPTIONS)) {
    if (normalize(k) === normName) return d;
  }
  for (const [k, d] of Object.entries(DESCRIPTIONS)) {
    const nk = normalize(k);
    if (normName.includes(nk) || nk.includes(normName)) return d;
  }
  return null;
}

const finalCatalog = [];
let totalCount = 0;

for (const [categoryName, items] of Object.entries(CATEGORY_PRODUCTS)) {
  const isUnit = ["Encapsulados", "Extrato", "Suplementos", "Mel"].includes(categoryName);

  for (const item of items) {
    totalCount++;
    const desc = getDesc(item.name, item.description);
    if (!desc) {
      console.warn(`[MISSING DESC]: ${item.name}`);
    }

    finalCatalog.push({
      category: categoryName,
      name: item.name,
      description: desc,
      price: item.price,
      unitType: isUnit ? "UN" : "KG",
      minQuantity: isUnit ? 1 : 100, // 100g para KG (regra do sistema: gramas >= 10), 1 para UN
      displayFraction: isUnit ? null : 100,
      isPinned: !!item.isPinned,
      imageUrl: item.imageUrl || null
    });
  }
}

console.log(`Total catalog items built: ${finalCatalog.length}`);
fs.writeFileSync("scripts/qualivida-seed-data.json", JSON.stringify(finalCatalog, null, 2), "utf-8");
console.log("Saved scripts/qualivida-seed-data.json successfully!");
