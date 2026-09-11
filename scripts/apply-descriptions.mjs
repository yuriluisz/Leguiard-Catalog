import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESCRIPTIONS = {
  // Farinhas e Pós
  "Açafrão Cúrcuma": "Puro açafrão-da-terra rico em curcumina, com potente ação anti-inflamatória e antioxidante natural.\nAuxilia no fortalecimento da imunidade, alívio de dores articulares e na saúde digestiva.\nIdeal para temperar arroz, sopas, legumes, ovos, molhos e shots matinais.",
  "Bicarbonato de Sódio": "Composto alcalino multifuncional de alta pureza para uso culinário e doméstico.\nAjuda a neutralizar a acidez estomacal e atua como agente fermentador em pães e bolos.\nTambém indicado para higienização de vegetais e receitas culinárias diversas.",
  "Cacau em Pó": "100% cacau puro, sem adição de açúcares, rico em flavonoides antioxidantes e magnésio.\nEstimula a produção de serotonina, promove a saúde cardiovascular e melhora a disposição.\nPerfeito para vitaminas, bolos fit, sobremesas, mingaus e café.",
  "Canela em Pó": "Especiaria aromática pura com propriedades termogênicas e digestivas naturais.\nAjuda a controlar os níveis de glicose no sangue e acelera o metabolismo de forma natural.\nExcelente para polvilhar em frutas, cafés, mingaus, panquecas e sobremesas.",
  "Catuaba em Pó": "Pó natural extraído da casca da catuaba, tradicional tônico energético e revigorante.\nAuxilia no combate ao cansaço físico e mental, aumentando o vigor e a disposição diária.\nPode ser adicionada a sucos, vitaminas, shakes energéticos e chás.",
  "Coco Ralado Médio": "Coco ralado puro, sem adição de açúcar e sem conservantes químicos.\nRico em fibras alimentares e gorduras boas (TCM) que fornecem energia rápida e saciedade.\nÓtimo para bolos, tapiocas, vitaminas, doces saudáveis e receitas low carb.",
  "Extrato de Soja Baunilha": "Extrato vegetal em pó sabor baunilha, excelente fonte de proteínas de alto valor biológico e isoflavonas.\nNutritivo e saboroso, é uma alternativa prática e saudável ao leite de origem animal.\nBasta misturar com água, frutas, vitaminas ou cereais no café da manhã.",
  "Farelo de Aveia": "Camada externa do grão de aveia, a parte mais rica em fibras solúveis beta-glucanas.\nAuxilia na redução do colesterol, promove saciedade prolongada e melhora o trânsito intestinal.\nIdeal para polvilhar sobre frutas, iogurtes, sopas ou em massas de pães e bolos.",
  "Farinha de Amêndoa": "Farinha nobre 100% amêndoas moídas, naturalmente sem glúten e com baixíssimo teor de carboidratos.\nRica em vitamina E, magnésio e gorduras monoinsaturadas boas para o coração.\nBase perfeita para receitas low carb, pães, tortas, bolos finos e cookies.",
  "Farinha de Aveia": "Farinha integral de aveia rica em fibras, vitaminas do complexo B e minerais essenciais.\nProporciona energia estável e melhora a digestão, conferindo textura macia às receitas.\nIdeal para preparar mingaus, panquecas saudáveis, vitaminas e biscoitos.",
  "Farinha de Banana Verde": "Rica em amido resistente, que atua como prebiótico nutrindo a flora intestinal saudável.\nContribui para o controle glicêmico, saciedade e melhora da saúde digestiva.\nPode ser consumida com sucos, iogurtes, frutas amassadas ou misturada em receitas.",
  "Farinha de Batata": "Fécula/farinha pura de batata, leve, suave e naturalmente sem glúten.\nProporciona leveza, retenção de umidade e maciez a pães, bolos e massas artesanais.\nMuito utilizada para engrossar caldos, sopas, molhos e empanados crocantes.",
  "Farinha de Beterraba": "Pó concentrado de beterraba integral, riquíssimo em nitratos naturais, ferro e antioxidantes.\nFavorece a vasodilatação, melhorando a circulação sanguínea e o rendimento físico.\nExcelente pré-treino natural para misturar em sucos, vitaminas e shakes.",
  "Farinha de Coco": "Farinha funcional obtida da polpa do coco, rica em fibras alimentares e pobre em carboidratos.\nAuxilia no bom funcionamento intestinal e confere suave aroma de coco às receitas.\nIndicada para receitas fit, panquecas, bolos low carb e pães.",
  "Farinha de Linhaça": "Farinha integral de linhaça moída, rica em ômega 3 vegetal, lignanas e fibras solúveis.\nAuxilia no equilíbrio hormonal, na saúde cardiovascular e na regularidade intestinal.\nPerfeita para misturar em iogurtes, saladas de frutas, sucos detox e massas integrais.",
  "Farinha de Maca Peruana": "Superalimento andino puro, reconhecido por suas propriedades adaptógenas e revigorantes.\nAumenta a vitalidade, equilibra os níveis hormonais e combate a fadiga física e mental.\nConsumir 1 a 2 colheres de chá ao dia misturada em sucos, shakes, iogurtes ou frutas.",
  "Farinha de Uva Preta": "Farinha elaborada a partir da casca e sementes de uvas pretas, concentrada em resveratrol.\nPotente antioxidante natural que combate radicais livres e apoia a saúde cardiovascular e celular.\nIdeal para enriquecer iogurtes, vitaminas, sucos, granolas e massas de pães.",
  "Feno Grego em Pó": "Especiaria milenar com propriedades digestivas, tônicas e reguladoras do metabolismo.\nAuxilia na regulação da glicemia, estimula a digestão e apoia a saúde hormonal.\nPode ser utilizado como tempero de pratos ou ingerido diluído em água e sucos.",
  "Gelatina em Pó": "Gelatina pura sem sabor e sem açúcar, rica em colágeno e aminoácidos essenciais.\nFortalece unhas, cabelos e articulações, além de aumentar a firmeza e elasticidade da pele.\nUsada no preparo de sobremesas leves, mousses saudáveis ou adicionada em vitaminas.",
  "Gengibre em Pó Puro": "Gengibre desidratado e moído, picante e aromático, com forte ação termogênica e digestiva.\nAuxilia na queima calórica, alivia náuseas e reforça o sistema imunológico.\nExcelente em chás, sucos verdes, temperos de carnes, aves e pratos orientais.",
  "Germe de Trigo": "A parte mais nobre e nutritiva do grão de trigo, abundante em vitamina E, zinco e ácido fólico.\nFortalece o sistema imunológico, combate o envelhecimento celular e melhora a disposição.\nSalpique sobre frutas, saladas, açaí, iogurtes ou adicione a massas de bolos e pães.",
  "Ginseng em Pó": "Raiz adaptógena tradicional de origem asiática, famosa por estimular a concentração e o foco.\nAjuda o organismo a se adaptar ao estresse físico e mental, promovendo energia duradoura.\nAdicione pequenas doses a sucos matinais, vitaminas ou chás revigorantes.",
  "Goma Xantana": "Espessante e estabilizante natural obtido pela fermentação de polissacarídeos.\nEssencial na culinária sem glúten para dar elasticidade, maciez e liga a massas e pães.\nUsar em pitadas pequenas (cerca de 1/2 colher de café por receita de bolo ou pão).",
  "Guaraná em Pó": "Pó natural da Amazônia, rica fonte de cafeína natural e compostos bioativos energéticos.\nProporciona foco, energia imediata, alerta mental e melhora do desempenho físico.\nIdeal para misturar em sucos de frutas, açaí ou água antes de atividades e estudos.",
  "Laranja Moro (Pó)": "Extrato puro da laranja vermelha Moro, naturalmente rico em antocianinas e vitamina C.\nAuxilia no gerenciamento do peso, redução de gordura localizada e combate aos radicais livres.\nDissolver em água ou sucos, preferencialmente pela manhã ou antes das principais refeições.",
  "Marapuama em Pó": "Planta nativa da flora amazônica, tradicionalmente empregada como estimulante físico e mental.\nAjuda a combater a fadiga, melhora a circulação e renova a vitalidade do organismo.\nPode ser adicionada a sucos de frutas, batidas energéticas ou infusões.",
  "Moringa Oleifera em Pó": "Superalimento verde considerado a 'árvore da vida', repleto de vitaminas, ferro e antioxidantes.\nAuxilia na imunidade, combate processos inflamatórios e melhora os níveis de energia.\nAdicione 1 colher de café em sucos verdes, vitaminas, sopas ou molhos.",
  "Pimenta Calabresa": "Flocos de pimenta vermelha desidratada que oferecem picância marcante e aroma intenso.\nContém capsaicina, substância com propriedades termogênicas e estimulantes da circulação.\nPerfeita para temperar carnes, molhos de tomate, pizzas, caldos e feijoadas.",
  "Proteína da Soja Isolada": "Proteína vegetal purificada de altíssimo valor biológico e rápida absorção.\nAuxilia na manutenção e ganho de massa muscular magra, sem gorduras ou açúcares.\nIdeal para shakes pós-treino, vitaminas, panquecas fit e receitas proteicas.",
  "Proteína de Soja Graúda": "Proteína vegetal texturizada (PTS) em pedaços graúdos, rica em proteínas e fibras.\nExcelente substituta da carne em ensopados, strogonoff vegano, molhos e refogados.\nBasta hidratar em água morna com temperos por 15 minutos antes de refogar.",
  "Psyllium Husk": "Fibra solúvel natural derivada da casca da semente de Plantago ovata, de alto poder de expansão.\nPromove saciedade intensa, regula o trânsito intestinal e ajuda no controle do colesterol.\nTomar 1 colher de sopa com bastante água ou usar em receitas de pães low carb.",
  "Shot Cúrcuma": "Blend concentrado de cúrcuma com especiarias ativadoras para reforço imunológico diário.\nCombate inflamações, protege as células e ativa o metabolismo logo pela manhã.\nDiluir 1 colher de café em água com gotas de limão em jejum.",
  "Temp. Pega Marido": "Mix artesanal de temperos aromáticos e ervas desidratadas com toque especial e marcante.\nCombina alho, cebola, cúrcuma, salsa e especiarias selecionadas para realçar qualquer receita.\nIdeal para temperar frangos, peixes, carnes bovinas, feijão e refogados do dia a dia.",
  "Tríbulos Terrestris": "Extrato botânico tradicionalmente utilizado para suporte hormonal e vigor físico.\nAuxilia no aumento da disposição, libido, força muscular e melhora da performance geral.\nPode ser consumido diluído em sucos, shakes matinais ou água.",

  // Açúcares e Adoçantes
  "Açúcar Demerara": "Açúcar de cana que passa por leve refinamento, mantendo sua camada de melaço natural e minerais.\nPossui cristais dourados com sabor suave de caramelo, sem aditivos químicos pesados.\nExcelente para adoçar cafés, chás, sucos e receitas de bolos caseiros com mais naturalidade.",
  "Xilitol": "Adoçante de origem vegetal com poder adoçante idêntico ao açúcar e 40% menos calorias.\nPossui baixo índice glicêmico e não provoca cáries, sendo seguro para diabéticos e low carb.\nIdeal para adoçar bebidas quentes, frias e no preparo de sobremesas sem sabor residual.",

  // Chás e Ervas
  "Alecrim em Flocos": "Folhas de alecrim secas e selecionadas, de aroma fresco, canforado e revigorante.\nAuxilia na digestão, melhora a circulação sanguínea e estimula a concentração e memória.\nExcelente tanto em infusões para chá quanto no preparo de batatas, carnes e pães.",
  "Aniz Estrelado": "Especiaria em formato de estrela com fragrância adocicada e sabor anisado marcante.\nPossui propriedades carminativas que aliviam gases, cólicas e desconfortos estomacais.\nÓtimo para chás digestivos, licores, caldos aromáticos e sobremesas finas.",
  "Camomila em Flor": "Flores inteiras e secas de camomila com propriedades calmantes e antiespasmódicas comprovadas.\nAlivia a ansiedade, relaxa o sistema nervoso e promove um sono profundo e restaurador.\nPrepare por infusão em água quente por 5 a 10 minutos antes de dormir.",
  "Canela em Pau": "Cascas nobres de canela enroladas, ricas em óleos essenciais terapêuticos e termogênicos.\nAjuda a regular o açúcar no sangue, aquece o corpo e melhora a digestão de gorduras.\nPerfeita para aromatizar chás, cafés, quentões, maçãs cozidas e arroz doce.",
  "Carqueja Amarga": "Erva medicinal brasileira clássica, consagrada pelo apoio à saúde hepática e estomacal.\nEstimula a digestão, reduz a sensação de empachamento e auxilia na eliminação de toxinas.\nConsumir na forma de chá por infusão, preferencialmente após as refeições principais.",
  "Chá Capim Cidreira": "Também conhecido como capim-limão ou capim-santo, de perfume cítrico e calmante natural.\nAlivia dores de cabeça leves, reduz tensões cotidianas e melhora a digestão.\nIdeal para ser consumido morno ou gelado a qualquer hora do dia para relaxar.",
  "Chá de Alcachofra": "Folhas de alcachofra ricas em cinarina, potente ativadora da função biliar e hepática.\nAuxilia na digestão de refeições pesadas e no controle do colesterol e triglicerídeos.\nIndicado para infusão após almoço ou jantar para leveza digestiva.",
  "Chá de Cana do Brejo": "Planta medicinal tradicionalmente utilizada para o equilíbrio do trato urinário.\nPossui ação diurética, anti-inflamatória e depurativa que auxilia na eliminação de líquidos retidos.\nFazer infusão de 1 colher de sopa para cada litro de água fervente.",
  "Chá de Cavalinha": "Erva riquíssima em silício orgânico e minerais, com poderoso efeito drenante e diurético.\nCombate o inchaço e a retenção de líquidos, além de fortalecer unhas, cabelos e ossos.\nExcelente para tomar ao longo do dia em planos de emagrecimento e desintoxicação.",
  "Chá de Centella Asiatica": "Erva medicinal reconhecida por estimular a microcirculação e a síntese de colágeno natural.\nAuxilia na redução de celulite, pernas pesadas e na cicatrização dos tecidos.\nTomar de 2 a 3 xícaras de infusão morna ao dia entre as refeições.",
  "Chá de Guaco": "Folhas de guaco ricas em cumarina, de forte ação broncodilatadora e expectorante natural.\nAlivia tosse, desconfortos respiratórios, gripes, resfriados e irritações na garganta.\nRecomenda-se infusão quente adoçada com uma colher de mel puro.",
  "Chá Dente de Leão": "Erva desintoxicante que atua limpando e fortalecendo as funções do fígado e rins.\nEstimula a produção de bile, combate a retenção de líquidos e melhora o aspecto da pele.\nBeba de 1 a 2 xícaras ao dia, preferencialmente entre as refeições.",
  "Chá de Passiflora": "Folhas de maracujazeiro silvestre, ricas em flavonoides com ação sedativa suave e relaxante.\nReduz a ansiedade, o estresse, a irritabilidade e melhora a qualidade do sono.\nIdeal para ser tomado quente no final da tarde ou cerca de 30 minutos antes de dormir.",
  "Chá de Quebra Pedra": "Tradicional erva medicinal da flora brasileira com reconhecida ação nas vias urinárias.\nAjuda a relaxar os canais urinários e auxilia na dissolução e prevenção de cálculos renais.\nPrepare por infusão e consuma de 2 a 3 xícaras ao dia.",
  "Chá de Salvia": "Erva nobre de sabor aromático e marcante, com ação antioxidante e digestiva.\nAuxilia no controle dos sintomas da menopausa, suores noturnos e inflamações na boca e garganta.\nUsar em infusão para beber ou para gargarejos em caso de irritação bucal.",
  "Chá Pau Tenente": "Também conhecido como quássia, famosa por seu sabor amargo e ação digestiva intensa.\nAuxilia no combate a parasitas intestinais, estimula o apetite e protege as paredes estomacais.\nIngerir pequenas xícaras de infusão antes ou logo após as principais refeições.",
  "Chá verde Talos e Folhas": "Chá verde integral com combinação equilibrada de talos e folhas ricas em catequinas e EGCG.\nAcelera o metabolismo, combate o envelhecimento precoce e promove energia focada sem ansiedade.\nInfusionar na água quente a 80°C por 3 minutos para não amargar.",
  "Cravo em Flor": "Botões secos de cravo-da-índia, de perfume penetrante e alto teor de eugenol antisséptico.\nAlivia dores, combate bactérias bucais, melhora a digestão e afasta sensação de inchaço.\nPerfeito para enriquecer chás digestivos, quentão, compotas de frutas e molhos.",
  "Erva Cidreira": "Melissinha pura com delicioso aroma cítrico relaxante e propriedades ansiolíticas leves.\nAlivia cólicas gastrointestinais, melhora o humor e acalma noites agitadas.\nExcelente chá para toda a família, saboroso e reconfortante a qualquer hora.",
  "Erva doce em Grãos": "Sementes selecionadas de pimpinella anisum, de aroma doce e aconchegante.\nClássico digestivo que alivia cólicas, gases infantis e de adultos, e acalma o estômago.\nPrepare por infusão ou decocção leve por 5 minutos e beba após as refeições.",
  "Espinheira Santa Chá": "Erva medicinal brasileira renomada pela comprovada proteção da mucosa gástrica.\nAlivia queimação, azia, gastrites e refluxos, normalizando o pH do estômago.\nConsumir 1 xícara de infusão morna cerca de 30 minutos antes do almoço e jantar.",
  "Flor de Hibisco": "Cálices inteiros de hibisco rubro, ricos em antocianinas, vitamina C e ácidos orgânicos.\nPossui potente efeito diurético, antioxidante e redutor da absorção de carboidratos.\nBeba morno ou gelado com raspas de limão ou gengibre para refrescância e desinchaço.",
  "Flor Fada Azul": "Flores secas de Clitoria ternatea que proporcionam um chá azul encantador e 100% natural.\nRiquíssima em antioxidantes que favorecem a memória, a saúde da pele e a clareza mental.\nMuda de cor para roxo vibrante ao adicionar gotas de limão; uma experiência única.",
  "Ginko Biloba em Pó": "Pó puro de ginkgo biloba, milenar fitoterápico para circulação e oxigenação cerebral.\nMelhora o foco, o rendimento cognitivo, a memória e atenua zumbidos no ouvido.\nConsumir 1 colher de café diluída em água, sucos naturais ou vitaminas matinais.",
  "Ginko Biloba Folhas": "Folhas secas selecionadas de Ginkgo biloba para preparo de infusões medicinais.\nFavorece o fluxo sanguíneo periférico, a memória, o raciocínio e a saúde dos vasos capilares.\nPrepare por infusão deixando repousar por 10 minutos em água fervente antes de coar.",
  "Hibisco em Pó": "Versão solúvel prática do hibisco, concentrada em antioxidantes e flavonoides diuréticos.\nFacilita a eliminação de toxinas, controla a pressão arterial e estimula o metabolismo.\nDissolver 1 colher de chá em água fria ou sucos para um refresco detox imediato.",
  "Lavanda": "Flores aromáticas de lavanda francesa alimentícia, com perfume suave e propriedades relaxantes.\nAuxilia no alívio de enxaquecas, ansiedade, tensões musculares e quadros de insônia.\nUse em infusões relaxantes à noite ou para aromatizar geleias, biscoitos e caldas finas.",
  "Matcha em Pó Gengibre": "Super blend termogênico que une o nobre chá verde cerimonial moído com gengibre puro.\nProporciona energia contínua por horas, queima calórica e alta concentração mental.\nBasta misturar 1 colher de café em água quente, leite vegetal ou bater com frutas.",
  "Mulungu": "Casca de mulungu nativa do Brasil, consagrada como um dos mais potentes calmantes naturais.\nAuxilia no combate a crises de ansiedade, estresse intenso, taquicardia nervosa e insônia severa.\nPrepare por decocção fervendo por 10 minutos e beba à noite para um descanso reparador.",
  "Picão Preto": "Erva medicinal brasileira tradicionalmente usada para equilíbrio hepático e desintoxicação.\nPossui ação anti-inflamatória, antialérgica, diurética e protetora das células do fígado.\nConsumir na forma de chá por infusão de 1 a 2 xícaras ao dia.",

  // Temperos
  "Alho em Pó": "Alho puro desidratado e moído que confere sabor marcante sem deixar pedaços nos pratos.\nRico em alicina, composto bioativo com propriedades antimicrobianas e benéficas ao coração.\nIdeal para marinar carnes, aves, temperar feijão, arroz, molhos e massas caseiras.",
  "Alho Granulado": "Pedaços crocantes de alho desidratado que liberam aroma e sabor intensos ao refogar.\nPraticidade máxima para a cozinha diária sem precisar descascar ou picar dentes de alho.\nExcelente em refogados de legumes, carnes grelhadas, pães de alho e farofas crocantes.",
  "Cebola em Pó": "Cebola desidratada finamente moída, prática e versátil para temperar com suavidade.\nDistribui o sabor da cebola de forma homogênea em caldos, marinadas e massas de hambúrguer.\nEssencial para empanados, sopas, molhos brancos e temperos secos artesanais.",
  "Chimichurri com Pimenta": "Autêntico tempero sul-americano à base de ervas nobres com um toque equilibrado de pimenta.\nCombina orégano, alho, salsa, cebola, pimenta calabresa e especiarias selecionadas.\nPerfeito para churrascos, bifes grelhados, marinadas de carnes vermelhas e molhos com azeite.",
  "Chimichurri sem Pimenta": "Mix tradicional de ervas finas selecionadas, pensado para quem aprecia sabor sem picância.\nRico em ervas desidratadas aromáticas como salsa, orégano, alho e folhas de louro.\nIdeal para aves, peixes, vegetais assados, vinagretes suaves e finalização de pratos.",
  "Colorau": "Pó aromático avermelhado obtido da semente de urucum triturada com farinha de milho.\nProporciona uma cor dourada vibrante e apetitosa a pratos cozidos, sem alterar o sabor.\nIndispensável no preparo de picadinhos, frango ensopado, feijão, carnes de panela e arroz.",
  "Flor de Sal": "A camada mais pura e nobre do sal marinho, colhida artesanalmente na superfície das salinas.\nCristais crocantes e delicados, ricos em minerais naturais sem aditivos químicos industriais.\nUsada exclusivamente para finalizar carnes grelhadas, saladas nobres, legumes e sobremesas.",
  "Folha de Louro": "Folhas inteiras selecionadas de louro, famosas pelo aroma amadeirado e sabor inconfundível.\nAuxilia na quebra de gases e digestão de pratos pesados e ricos em leguminosas.\nO segredo indispensável da feijoada, feijão caseiro, molhos de tomate e ensopados.",
  "Lemon Pepper": "Combinação refrescante de raspas de limão desidratadas com pimenta-do-reino e especiarias.\nConfere um toque cítrico marcante e levemente picante que transforma receitas simples.\nCombinação perfeita para peixes, frutos do mar, filé de frango, batatas e pipoca.",
  "Orange Pepper": "Tempero artesanal exclusivo que harmoniza notas cítricas de laranja com pimentas aromáticas.\nTraz um perfil gastronômico agridoce, vibrante e refinado que surpreende o paladar.\nExcelente para marinar salmão, cortes de porco, aves no forno e saladas especiais.",
  "Orégano Turco": "Orégano especial de origem mediterrânea com altíssima concentração de óleos essenciais.\nAroma mais intenso, floral e penetrante que o orégano convencional de mercado.\nIndispensável em pizzas artesanais, queijos, massas, molhos de tomate e legumes grelhados.",
  "Tempero de Feijão": "Blend completo de ervas e especiarias desenvolvido especialmente para o feijão perfeito.\nTraz louro, alho, cebola, cominho e ervas aromáticas na proporção certa para o caldo engrossar.\nBasta adicionar no refogado do feijão para um sabor caseiro inesquecível e reconfortante.",
  "Tempero Edu Guedes": "Mix clássico brasileiro de vegetais desidratados crocantes com tempero marcante.\nContém cenoura, cebola, pimentão, alho, salsa e cúrcuma em pedacinhos aromáticos.\nVersátil para temperar arroz, caldos, recheios de tortas, legumes refogados e carnes.",
  "Vinagrete em Flocos": "Mistura desidratada prática de flocos de tomate, cebola, pimentões coloridos e cheiro-verde.\nBasta hidratar com água morna, azeite e vinagre para ter um vinagrete fresco em minutos.\nIdeal para acompanhar churrascos, pasteis, saladas e finalizar sanduíches.",

  // Castanhas e Frutos Secos
  "Amêndoa": "Amêndoas inteiras cruas e naturais, uma das oleaginosas mais completas e nutritivas do mundo.\nRicas em vitamina E, cálcio, proteínas vegetais e gorduras benéficas à saúde cardíaca.\nLanche perfeito entre as refeições, para bater em vitaminas ou usar em receitas fit.",
  "Amêndoa Defumada Salgada": "Amêndoas nobres tostadas artesanalmente com aroma defumado marcante e toque de sal marinho.\nSnack incrivelmente crocante e saboroso, rico em magnésio e gorduras de qualidade.\nPetisco sofisticado para tábuas de frios, momentos de lazer e lanches nutritivos.",
  "Amendoim": "Grãos de amendoim selecionados, fonte energética rica em proteínas, gorduras boas e niacina.\nApoia a energia muscular, o bom humor e a sensação de saciedade ao longo do dia.\nÓtimo para consumo in natura, preparo de pastas de amendoim caseiras ou receitas salgadas.",
  "Amendoim com Pimenta": "Amendoins crocantes envolvidos em tempero picante especial e especiarias aromáticas.\nCombinação irresistível de crocância com picância na medida certa para quem ama sabor.\nPetisco excelente para reunir amigos, acompanhar bebidas ou como snack estimulante.",
  "Castanha de Caju": "Castanhas de caju selecionadas inteiras, com textura macia e sabor amanteigado natural.\nRiquíssimas em zinco, ferro, fósforo e gorduras monoinsaturadas amigas do coração.\nConsuma puras no dia a dia ou adicione em granolas, saladas verdes e pratos orientais.",
  "Castanha de Caju Caramelizada": "Castanhas de caju premium envoltas em fina e crocante crosta de açúcar caramelizado.\nEquilíbrio perfeito entre o sabor da castanha e a doçura do caramelo crocante.\nUma sobremesa saudável e reconfortante para momentos em que bate vontade de um doce.",
  "Castanha do Pará": "Castanha-do-Brasil autêntica, a maior fonte natural de selênio bioativo do planeta.\nApenas 1 a 2 unidades ao dia cobrem a necessidade diária para proteger a tireoide e imunidade.\nEssencial para a longevidade celular, saúde cerebral e prevenção de danos oxidativos.",
  "Mix de Castanhas": "Seleção nobre de castanha de caju, castanha do Pará, nozes e amêndoas inteiras selecionadas.\nCombinação perfeita de antioxidantes, ômegas, magnésio e minerais essenciais ao organismo.\nPraticidade e nutrição concentrada em um só punhado para o seu lanche da tarde.",
  "Nozes Quartz": "Metades nobres de nozes claras tipo Quartz, crocantes, frescas e de sabor suave.\nRicas em ácidos graxos ômega 3 vegetal, reconhecidos por proteger o cérebro e o coração.\nIdeais para o café da manhã, saladas nobres, risotos, queijos e sobremesas finas.",

  // Desidratados
  "Ameixa sem Caroço": "Ameixas pretas desidratadas naturalmente doces, suculentas e ricas em fibras e sorbitol.\nReconhecidas pelo comprovado auxílio no trânsito intestinal e na saúde óssea e digestiva.\nConsuma in natura, em vitaminas matinais, compotas saudáveis ou com aveia e iogurte.",
  "Banana Desidratada": "Pedaços de banana pura desidratada sem conservantes e sem adição de nenhum açúcar.\nFonte imediata de energia limpa, carboidratos saudáveis, potássio e vitaminas do complexo B.\nSnack prático para carregar na bolsa, ideal para ciclistas, treinos e merenda escolar.",
  "Chips de Coco": "Lâminas crocantes de polpa de coco natural desidratada, naturalmente doces e sem açúcar.\nRicos em ácidos graxos TCM que geram saciedade prolongada e energia imediata e cetogênica.\nPerfeitos para comer puro como snack crocante ou salpicar sobre tigelas de açaí e iogurte.",
  "Cramberry": "Cranberries selecionados desidratados, de sabor agridoce vibrante e coloração rubi intensa.\nFamosos pela alta concentração de proantocianidinas que apoiam a saúde do trato urinário.\nExcelentes para enriquecer granolas, saladas de folhas verdes, cookies e bolos fit.",
  "Damasco": "Damascos secos selecionados, carnudos e aveludados, ricos em betacaroteno e vitamina A.\nFavorecem a saúde ocular, a regeneração da pele e são fonte natural de ferro e potássio.\nLanche sofisticado para comer puro, acompanhar queijos nobres ou rechear com castanhas.",
  "Kiwi Desidratado": "Fatias de kiwi cuidadosamente desidratadas, com sabor tropical agridoce refrescante.\nPreservam doses concentradas de vitamina C, fibras e enzimas digestivas naturais da fruta.\nSnack colorido e nutritivo para lanches intermediários ou para decorar sobremesas saudáveis.",
  "Morango Desidratado": "Morangos inteiros desidratados que preservam a cor vibrante e o aroma doce natural da fruta.\nRicos em antioxidantes antocianinas, que combatem o envelhecimento celular e fortalecem o corpo.\nDelicioso para saborear puro, picar em cereais matinais, iogurtes ou sobremesas requintadas.",
  "Tamara Jumbo": "Tâmaras gigantes nobres e carnudas, com textura macia e sabor caramelizado irresistível.\nExcelente substituta natural do açúcar refinado, riquíssima em fibras, ferro e energia pura.\nPerfeitas para pré-treinos rápidos, recheadas com pasta de amendoim ou castanhas.",
  "Uva Passa Preta": "Uvas passas pretas selecionadas e doces, ricas em antioxidantes resveratrol e boro mineral.\nFornecem energia rápida para o dia a dia, melhoram a digestão e fortalecem os ossos.\nIdeais para salpicar em saladas, arroz de festa, granolas caseiras, bolos e pães.",

  // Sementes
  "Feno Grego": "Sementes inteiras aromáticas com sabor característico e propriedades medicinais milenares.\nAuxiliam no equilíbrio da glicemia, na saúde da mulher e no estímulo do sistema digestivo.\nPodem ser consumidas em chás, germinadas como brotos nutritivos ou no preparo de pratos.",
  "Gergelim Branco": "Sementes de gergelim natural branco, uma das fontes vegetais mais ricas em cálcio biodisponível.\nFortalece os ossos e dentes, melhora a saúde da pele e fornece gorduras saudáveis e fibras.\nDelicioso tostado sobre saladas, pães artesanais, arroz oriental, homus e legumes.",
  "Gergelim Preto": "Sementes inteiras de gergelim negro com sabor terroso intenso e alto poder antioxidante.\nRico em sesamina e minerais que auxiliam na prevenção celular e saúde cardiovascular.\nPerfeito para crostas de peixes, sushis, pães funcionais, saladas e bowls asiáticos.",
  "Linhaça": "Sementes douradas/marrons inteiras de linhaça, concentradas em ômega 3 vegetal e fibras solúveis.\nMelhoram o colesterol, previnem inflamações e garantem excelente regularidade intestinal.\nTriture antes de consumir em frutas, sucos detox, iogurtes ou acrescente em pães integrais.",
  "Milho Espanhol": "Grãos de milho especial tostados e crocantes com textura aerada e tempero equilibrado.\nSnack incrivelmente crocante e saboroso, sem glúten, perfeito para saciar a fome com alegria.\nExcelente petisco para momentos de lazer, happy hours e acompanhamento descontraído.",
  "Quinua Branca": "Grãos andinos nobres considerados um dos alimentos mais completos em aminoácidos essenciais.\nFonte completa de proteína vegetal, ferro, magnésio e fibras, naturalmente sem glúten.\nCozinhe como o arroz ou adicione a saladas frias, sopas, hambúrgueres veganos e risotos.",
  "Quinua Mix": "Combinação harmônica de quinua branca, vermelha e preta, com visual sofisticado e textura al dente.\nOferece todas as proteínas e minerais da quinua com variedade de fitonutrientes protetores.\nPerfeita para saladas coloridas de verão, recheios de vegetais assados e pratos gourmet.",
  "Semente Chias Hispa": "Sementes de chia selecionadas com extraordinária capacidade de formar gel hidratante no estômago.\nProporcionam saciedade por longas horas, regulam o intestino e fornecem ômega 3 concentrado.\nBasta hidratar em água, sucos ou leites vegetais para fazer pudins de chia e vitaminas.",
  "Semente de Abóbora": "Sementes de abóbora sem casca tostadas, uma das melhores fontes de magnésio e zinco da natureza.\nFortalecem a próstata, aumentam a imunidade, melhoram o sono e protegem o coração.\nSnack crocante delicioso para comer puro ou salpicar sobre cremes, sopas e saladas verdes.",
  "Semente de Girassol": "Sementes de girassol sem casca de sabor suave e crocância delicada, ricas em vitamina E.\nPotente antioxidante que protege as células da pele e apoia o equilíbrio cardiovascular.\nÓtima para enriquecer pães artesanais, granolas caseiras, saladas e pastas vegetais.",

  // Encapsulados, Extratos e Suplementos
  "Amora Miúra": "Extrato concentrado de folhas de amora miúra em cápsulas práticas de alta absorção.\nReconhecida pelo alívio dos calores e sintomas da menopausa, além de apoiar a glicemia e o sono.\nTomar conforme a orientação do rótulo, preferencialmente junto das principais refeições.",
  "Ashwagandha": "Famoso adaptógeno da medicina ayurvédica em cápsulas, conhecido por equilibrar os níveis de cortisol.\nCombate o estresse crônico, a ansiedade e a exaustão, promovendo calma com clareza mental.\nIndicado para consumo diário com água, ajudando o corpo a lidar com o ritmo acelerado.",
  "Bela Beauty Fortalecedor": "Fórmula vitamínica e mineral completa desenvolvida para nutrição celular profunda de unhas, pele e cabelos.\nEstimula a síntese natural de colágeno, reduz a queda capilar e acelera o crescimento forte das unhas.\nIngerir as cápsulas diariamente acompanhadas de água para resultados visíveis e duradouros.",
  "Biotina": "Vitamina B7 pura e concentrada em cápsulas, essencial para a saúde capilar e metabólica.\nFortalece os fios desde a raiz, combate a quebra capilar e melhora a firmeza das unhas frágeis.\nTomar 1 cápsula ao dia pela manhã para apoiar o metabolismo de proteínas e queratina.",
  "Biotina Gummy Hair": "Gominhas mastigáveis saborosas enriquecidas com biotina, vitaminas e minerais essenciais.\nManeira prática, divertida e deliciosa de cuidar da força dos cabelos, unhas e brilho da pele.\nConsumir conforme a recomendação da embalagem, tornando o cuidado diário um prazer.",
  "Cabelo, Pele e Unha": "Complexo sinérgico de vitaminas A, C, E, zinco, biotina e minerais para beleza e vitalidade.\nProtege contra o estresse oxidativo, combate o envelhecimento precoce e fortalece tecidos.\nTomar diariamente para uma nutrição de dentro para fora com resultados consistentes.",
  "Cardo Mariano": "Extrato de silybum marianum padronizado em silimarina, renomado protetor das células hepáticas.\nAuxilia no processo de desintoxicação do fígado, na digestão de gorduras e renovação celular.\nIndicado para quem busca regeneração e suporte funcional para o sistema digestivo e fígado.",
  "Castanha da Índia": "Fitoterápico clássico em cápsulas, consagrado pelo estímulo ao tônus venoso e circulação periférica.\nAuxilia no alívio de pernas pesadas, inchaço, sensação de cansaço nas pernas e varizes.\nConsumir com água de acordo com as instruções da embalagem.",
  "Cloreto de Magnésio P.A com Sucupira": "Combinação sinérgica do mineral magnésio P.A. com extrato natural puro de sucupira.\nAção anti-inflamatória e analgésica que alivia dores articulares, musculares e na coluna.\nIdeal para promover mobilidade, flexibilidade e bem-estar físico no dia a dia.",
  "Dente de Leão": "Cápsulas concentradas de dente de leão com forte ação desintoxicante e diurética suave.\nEstimulam a eliminação de toxinas pelo fígado e rins, reduzindo inchaços e melhorando a digestão.\nIngerir com água antes das refeições principais para leveza corporal e equilíbrio.",
  "Erva Baleeira": "Nativa da Mata Atlântica, contém humuleno, princípio ativo com potente ação anti-inflamatória.\nMuito eficaz no alívio de dores musculares, reumatismo, contusões e artrites.\nUso prático em cápsulas para alívio natural e preservação da saúde das articulações.",
  "Espinheira Santa": "Extrato concentrado em cápsulas para máxima proteção estomacal e alívio de refluxo e queimação.\nNormaliza as funções gástricas de forma rápida e prática sem necessidade de infusões.\nTomar cerca de 15 a 30 minutos antes das refeições principais.",
  "Ginko Biloba": "Extrato padronizado em cápsulas de Ginkgo biloba para melhora da oxigenação e fluxo cerebral.\nFavorece a retenção de memória, concentração, clareza mental e combate o declínio cognitivo.\nTomar diariamente com água para manter o cérebro afiado e ativo em todas as idades.",
  "Levedo de Cerveja": "Fermento natural inativo, uma das mais ricas fontes de vitaminas do complexo B e proteínas.\nMelhora o viço da pele, a disposição diária, combate a fadiga e apoia a saúde intestinal.\nExcelente suplemento nutricional de fácil ingestão diária para jovens e adultos.",
  "Maca Peruana Negra": "A variedade mais rara e potente da maca andina, rica em bioativos para energia e foco.\nPromove ganho de força muscular, vitalidade física, resistência e vigor hormonal natural.\nTomar as cápsulas pela manhã para disposição renovada ao longo de todo o dia.",
  "Magnésio di Malato": "Magnésio quelato ligado ao ácido málico, de altíssima biodisponibilidade e absorção celular.\nReduz dores musculares, previne cãibras, melhora a produção de energia mitocondrial e combate a fadiga.\nExcelente para pessoas ativas, praticantes de exercícios e alívio do cansaço físico.",
  "Natu Cúrcuma": "Cúrcuma concentrada com máxima pureza em cápsulas para potente alívio anti-inflamatório.\nProtege as articulações contra o desgaste, combate radicais livres e melhora a imunidade.\nPraticidade de usufruir de todos os benefícios da curcumina sem o sabor forte da raiz.",
  "Óleo de Abacate": "Cápsulas de óleo extravirgem de abacate prensado a frio, riquíssimo em ômega 9 e beta-sitosterol.\nAuxilia no equilíbrio dos níveis de colesterol, na saúde da próstata e no controle glicêmico.\nTomar com água junto às refeições para absorção ótima de nutrientes lipossolúveis.",
  "Óleo de Alho": "Cápsulas puras de óleo de alho que concentram alicina sem deixar hálito forte após a ingestão.\nReforça as defesas imunológicas, atua como antibacteriano natural e protege o coração.\nIdeal para uso diário na prevenção de gripes, resfriados e manutenção da saúde vascular.",
  "Ora Pro Nobris": "Cápsulas puras da famosa 'carne dos pobres', riquíssima em proteínas vegetais, ferro e fibras.\nCombate a anemia, melhora a disposição, fortalece a imunidade e auxilia na digestão.\nSuplemento natural completo para quem busca nutrição densa e equilibrada no dia a dia.",
  "Seca Barriga + Colágeno": "Combinação de farinhas funcionais ricas em fibras com adição de colágeno hidrolisado em cápsulas.\nAuxilia no controle da fome, eliminação de toxinas e mantém a firmeza da pele durante o emagrecimento.\nTomar com bastante água cerca de 30 minutos antes das principais refeições.",
  "Seca Barriga Detox": "Blend de extratos vegetais e fibras solúveis que atuam acelerando o metabolismo e a digestão.\nEstimula a queima calórica, combate a retenção de líquidos e reduz o inchaço abdominal.\nTomar diariamente com boa ingestão de líquidos ao longo do dia para melhores resultados.",
  "Spirulina": "Microalga verde-azulada considerada superalimento pela OMS por sua densidade nutricional única.\nContém mais de 60% de proteínas completas, ferro e antioxidantes que aumentam a imunidade e energia.\nExcelente para ser consumida antes das refeições para promover saciedade natural.",
  "SSB ( Super Seca Barriga )": "Fórmula fitoterápica potente desenvolvida para apoio intenso ao gerenciamento de peso e medidas.\nCombina ervas diuréticas, termogênicas e reguladoras do trânsito intestinal em cápsulas.\nIngerir com água conforme o modo de uso para ativação metabólica e desinchaço corporal.",
  "Sucupira Composta": "Fórmula tradicional que associa sementes de sucupira a ervas anti-inflamatórias sinérgicas.\nAjuda a aliviar dores reumáticas, artrites, artroses, bicos de papagaio e inflamações crônicas.\nConsumir regularmente para mais mobilidade, alívio de incômodos e qualidade de vida.",
  "Suplemento Alimentar": "Fórmula multivitamínica e mineral balanceada para suprir carências nutricionais do dia a dia.\nMelhora a imunidade, a vitalidade diária, o metabolismo energético e a concentração mental.\nTomar 1 a 2 cápsulas ao dia com uma refeição para absorção completa de nutrientes.",
  "Uxi Amarelo e Unha de Gato": "Clássica dupla da medicina tradicional amazônica consagrada para a saúde da mulher.\nPotente ação anti-inflamatória e imunomoduladora que apoia o sistema reprodutivo feminino.\nTomar regularmente com água para auxílio no equilíbrio do organismo e bem-estar íntimo.",
  "Vitamina K2": "Vitamina K2 (MK-7) de alta pureza, essencial para direcionar o cálcio aos ossos e dentes.\nEvita o depósito inadequado de cálcio nas artérias, promovendo saúde cardiovascular e óssea.\nConsumir 1 cápsula ao dia junto a uma refeição que contenha gorduras boas.",
  "Chá Amargo": "Extrato líquido concentrado de ervas amargas digestivas tradicionais brasileiras.\nAlivia rapidamente sensação de peso estomacal, azia, queimação e indigestão após as refeições.\nTomar 1 colher de sopa diluída em meio copo de água após as refeições ou quando necessário.",
  "Extrato de Própolis": "Extrato puro de própolis com alta concentração de bioflavonoides e compostos fenólicos.\nAntibiótico e anti-inflamatório natural que fortalece a imunidade e alivia dores de garganta.\nPingue de 20 a 30 gotas em água, suco ou chá morno, preferencialmente pela manhã.",
  "Óleo de Semente de Abóbora": "Óleo vegetal nobre prensado a frio, abundante em zinco, fitoesteróis e ácidos graxos ômega 6 e 9.\nFavorece a saúde da próstata, do trato urinário e apoia o equilíbrio hormonal masculino e feminino.\nTomar conforme a recomendação do fabricante ou usar para finalizar saladas e pratos frios.",
  "Colágeno Hidrolisado": "Colágeno em pó puro com peptídeos bioativos de rápida absorção e aproveitamento pelo corpo.\nAumenta a elasticidade da pele, atenua rugas e linhas de expressão e fortalece articulações e unhas.\nDiluir 1 colher de sopa em água, sucos ou vitaminas e consumir diariamente.",
  "Creatina em Pó": "100% creatina monohidratada de alta pureza e solubilidade para suporte neuromuscular.\nAumenta a força muscular, a potência em treinos de alta intensidade e acelera a recuperação física.\nDissolver 3g a 5g em água ou suco e consumir diariamente, inclusive nos dias sem treino.",
  "Glutamina em Pó": "L-glutamina pura em pó, aminoácido essencial para a integridade da barreira intestinal e imunidade.\nAcelera a recuperação tecidual após esforços físicos intensos e reduz o estresse celular.\nDissolver 5g em água ou bebida favorita e consumir em jejum ou após os treinos."
};

function normalize(str) {
  return (str || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findDescription(productName) {
  const normName = normalize(productName);

  // Exact normalized match
  for (const [key, desc] of Object.entries(DESCRIPTIONS)) {
    if (normalize(key) === normName) {
      return desc;
    }
  }

  // Partial match
  for (const [key, desc] of Object.entries(DESCRIPTIONS)) {
    const normKey = normalize(key);
    if (normName.includes(normKey) || normKey.includes(normName)) {
      return desc;
    }
  }

  return null;
}

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: "qualivida" } });
  if (!store) {
    console.error("Qualivida store not found!");
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      OR: [
        { description: null },
        { description: "" }
      ]
    },
    include: { category: true },
    orderBy: { name: "asc" }
  });

  console.log(`Total de produtos a atualizar: ${products.length}`);

  let updatedCount = 0;
  let missingMatchCount = 0;

  for (const product of products) {
    const desc = findDescription(product.name);
    if (!desc) {
      console.warn(`[SEM MATCH]: "${product.name}"`);
      missingMatchCount++;
      continue;
    }

    // Verify line count <= 3
    const lines = desc.split("\n").filter(l => l.trim().length > 0);
    if (lines.length > 3) {
      console.warn(`[AVISO LINHAS > 3]: ${product.name} tem ${lines.length} linhas.`);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { description: desc }
    });

    updatedCount++;
    console.log(`[${updatedCount}/${products.length}] Atualizado: ${product.name}`);
  }

  console.log(`\nAtualização finalizada!`);
  console.log(`Produtos atualizados com sucesso: ${updatedCount}`);
  console.log(`Produtos sem match: ${missingMatchCount}`);
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
