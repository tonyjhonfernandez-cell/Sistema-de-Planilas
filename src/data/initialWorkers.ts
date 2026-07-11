import { Worker, Concept } from "../types";

// Compressed interface for token-efficient storage of initial data
interface CompressedWorker {
  id: string; // DNI
  ap: string; // Apellidos
  nom: string; // Nombres
  est: string; // Establecimiento
  car: string; // Cargo
  rm: number; // Base RM
  pen: string; // Pensión Regime
  ing?: string; // Fecha Ingreso
  term?: string; // Fecha Término
  cta?: string; // Cuenta Ahorro
  ley?: string; // Leyenda Permanente
  nac?: string; // Fecha Nacimiento
  ess?: string; // Seguro ESSALUD code
  
  // Specific overrides for bonuses / deductions in June 2026
  coop?: number; // COOP / Coop-s.c.b
  tard?: number; // Tardanzas
  cafae?: number; // SUBCAFAE
  copac?: number; // COPAC / Copac San
  faltas?: number; // Faltas
  reint?: number; // Reintegro
  
  // Custom bonus flag (e.g. DS327 instead of DS317)
  ds327?: boolean;
  // Prorated bonus flag
  prorated?: boolean;
}

const rawWorkers: CompressedWorker[] = [
  {
    id: "71602492", ap: "FLORES LANARES", nom: "KAREN JANETH", est: "Sede Administrativa",
    car: "ANALISTA ADMINISTRATI. E INSTITUCIONALES", rm: 2600, pen: "AFP HABITAT",
    ing: "01/05/2021", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "12/12/1996",
    ess: "9308291PESTA008", coop: 645, tard: 12.56
  },
  {
    id: "71848797", ap: "MARTINEZ RAFAEL", nom: "YENY JUDITH", est: "Sede Administrativa",
    car: "ESPECIALISTA EN P.P.", rm: 2600, pen: "AFP PRIMA",
    ing: "01/01/2024", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "22/03/1996",
    ess: "9308291PESTA008", coop: 1100, cafae: 226.74, tard: 5.76
  },
  {
    id: "40666029", ap: "RAMIREZ RIOS", nom: "BEROCCIO", est: "Sede Administrativa",
    car: "ANALISTA ADMINISTRATI. E INSTITUCIONALES", rm: 2600, pen: "AFP INTEGRA",
    ing: "01/01/2022", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "20/08/1980",
    ess: "9308291PESTA008", coop: 931, cafae: 150, tard: 2.26, ds327: true
  },
  {
    id: "72087286", ap: "TORRES RENGIFO", nom: "DIEGO", est: "Sede Administrativa",
    car: "ANALISTA EN NEXUS", rm: 2400, pen: "AFP INTEGRA",
    ing: "01/01/2022", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "14/08/1994",
    ess: "9308291PESTA008", tard: 6.53, ds327: true
  },
  {
    id: "47059094", ap: "BRAVO BUSTAMANTE", nom: "DAYXS", est: "SEDE ADMINISTRATIVA",
    car: "ESPECIALISTA EN ESCALAFON", rm: 2600, pen: "AFP HABITAT",
    ing: "20/04/2023", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "09/06/1992",
    ess: "9308291PESTA008", tard: 0.77
  },
  {
    id: "41048864", ap: "CAMPOS VIERA", nom: "JUAN CARLOS", est: "SEDE ADMINISTRATIVA",
    car: "ESPECIALISTA EN PLANILLAS", rm: 2200, pen: "AFP PROFUTURO",
    ing: "20/04/2023", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "16/09/1981",
    ess: "9308291PESTA008", coop: 665
  },
  {
    id: "00869906", ap: "USHIÑAHUA TRIGOSO", nom: "HUGO", est: "SEDE ADMINISTRATIVA",
    car: "CHOFER", rm: 1685.81, pen: "LEY 19990",
    ing: "14/03/2024", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "01/12/1975",
    ess: "9308291PESTA008", cafae: 150, copac: 362
  },
  {
    id: "76642285", ap: "CARRASCO HOLGUIN", nom: "ROXANITA", est: "SEDE ADMINISTRATIVA",
    car: "ESPECIALISTA EN SIAGIE", rm: 1885.81, pen: "AFP INTEGRA",
    ing: "14/03/2024", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "19/06/1996",
    ess: "9308291PESTA008"
  },
  {
    id: "45849880", ap: "LA TORRE RENGIFO", nom: "DANIEL LEONIDAS", est: "Sede Administrativa",
    car: "ESPECIALISTA EN INFRAESTRUCTURA", rm: 2785.81, pen: "AFP PRIMA",
    ing: "01/01/2022", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "20/07/1989",
    ess: "9308291PESTA008", coop: 1100, cafae: 150
  },
  {
    id: "74644880", ap: "RAMIREZ CABANILLAS", nom: "SUTKEY MILAGROS", est: "Sede Administrativa",
    car: "ESPECIALISTA EN ARCHIVO", rm: 1885.81, pen: "AFP PRIMA",
    ing: "03/02/2025", term: "31/10/2025", ley: "CONT. 03-02 AL 31-10", nac: "26/09/1996",
    ess: "9308291PESTA008", tard: 3.60
  },
  {
    id: "47843680", ap: "CUBAS SANCHEZ", nom: "MARIA MARGARITA", est: "Sede Administrativa",
    car: "ESPECIALISTA EN PATRIMONIO Y ALMACEN", rm: 2600, pen: "AFP HABITAT",
    ing: "03/02/2025", term: "31/10/2025", ley: "CONT. 01-05 AL 31-10-26", nac: "19/09/1994",
    ess: "9308291PESTA008", tard: 2.50
  },
  {
    id: "44072546", ap: "PEREZ AVILA", nom: "YNES PAOLA", est: "Sede Administrativa",
    car: "Analista Estadistico I", rm: 2400, pen: "AFP PROFUTURO",
    ing: "13/05/2025", term: "30/09/2024", ley: "CONT. 13-05 AL 30-09", ess: "9308291PESTA008"
  },
  {
    id: "71480435", ap: "SALAZAR GARCIA", nom: "VIOLETA", est: "Sede Administrativa",
    car: "ESPECIALISTA EN BIENESTAR", rm: 1535.81, pen: "AFP HABITAT",
    ing: "01/12/2025", term: "31/12/2025", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "77148043", ap: "VELA VASQUEZ", nom: "FIORELLA LUDITH", est: "Sede Administrativa",
    car: "PROYECTISTA", rm: 1735.81, pen: "LEY 19990",
    ing: "01/12/2025", term: "31/12/2025", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "74657864", ap: "MUÑOZ GONZALES", nom: "MARYORI STEPHANY", est: "Sede Administrativa",
    car: "TECNICO ADMINISTRATIVO DE MESA DE PARTES", rm: 1535.81, pen: "AFP INTEGRA",
    ing: "01/12/2025", term: "31/12/2025", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "71928865", ap: "SANGAMA GUERRA", nom: "LLENY", est: "Sede Administrativa",
    car: "SECRETARIA DE LA OFICINA DE ADMINISTARCION", rm: 1535.81, pen: "AFP INTEGRA",
    ing: "01/12/2025", term: "31/12/2025", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "47109452", ap: "ESCOBEDO VILCHEZ", nom: "YESENIA MARISOL", est: "Sede Administrativa",
    car: "SECRETARIA DE RECURSOS HUMANOS", rm: 1535.81, pen: "AFP PRIMA",
    ing: "01/12/2025", term: "31/12/2025", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008",
    copac: 304.80, tard: 1.63
  },
  {
    id: "48024213", ap: "SALAZAR CASTRO", nom: "VERONICA", est: "Sede Administrativa",
    car: "ESPECIALISTA EN ABASTECIMIENTO", rm: 2685.81, pen: "LEY 19990",
    ing: "02/02/2026", term: "30/04/2026", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008",
    faltas: 304.80
  },
  {
    id: "71776200", ap: "VASQUEZ CHUQUILIN", nom: "KEYLA LIVANY", est: "Sede Administrativa",
    car: "ESPECIALISTA EN PROCESO ADMINISTRATIVO DISCIPLINARIO", rm: 2500, pen: "AFP INTEGRA",
    ing: "02/02/2026", term: "30/04/2026", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "46864420", ap: "PANDURO MEGO", nom: "GIANMARCO", est: "Sede Administrativa",
    car: "ESPECIALISTA EN INFORMATICA I en la UGEL BELLAVISTA", rm: 2500, pen: "AFP PRIMA",
    ing: "02/02/2026", term: "30/04/2026", ley: "CONT. 01-12 AL 31-12", ess: "9308291PESTA008"
  },
  {
    id: "45566260", ap: "GUEVARA TAFUR", nom: "JHEIMMY CARMIN", est: "Sede Administrativa",
    car: "ESPECIALISTA EN FINANZAS", rm: 2785.81, pen: "AFP PRIMA",
    ing: "01/04/2026", term: "30/06/2026", ley: "CONT. 01-04 AL 30-06", ess: "9308291PESTA008"
  },
  {
    id: "70076501", ap: "PEZO CUMAPA", nom: "GIANNY", est: "Sede Administrativa",
    car: "JEFA DE LA O.A.J.", rm: 4235.81, pen: "AFP INTEGRA",
    ing: "24/02/2025", ley: "CONT. 24-02-2025", nac: "07/09/1992", ess: "9308291PESTA008"
  },
  {
    id: "05373518", ap: "SALDAÑA PEREZ", nom: "SEGUNDO HIPOLITO", est: "Sede Administrativa",
    car: "RESPONSABLE DE LA O.RR.HH.", rm: 3735.81, pen: "AFP PROFUTURO",
    ing: "11/08/2025", ley: "CONT. 11-08-2025", ess: "9308291PESTA008"
  },
  {
    id: "74223117", ap: "FERNANDEZ DIAZ", nom: "TONY JHON", est: "SEDE ADMINISTRATIVA",
    car: "JEFE DE A.G.I.", rm: 4235.81, pen: "AFP PRIMA",
    ing: "27/02/2025", ley: "CONT. 27-02-2025", ess: "9308291PESTA008", coop: 1230
  },
  {
    id: "42268073", ap: "MARIN QUEZADA", nom: "LEYDI", est: "Sede Administrativa",
    car: "JEFA DE LA OFICINA DE ADMINISTRACION", rm: 5500, pen: "AFP PROFUTURO",
    ing: "05/08/2024", ley: "CONT. 05-08", nac: "18/12/1983", ess: "9308291PESTA008"
  },
  {
    id: "46864559", ap: "HUANSI VASQUEZ", nom: "SHEILY SAY", est: "Sede Administrativa",
    car: "RESPONSABLE CONVIVENCIA ESCOLAR", rm: 3500, pen: "AFP INTEGRA",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "16/08/1991",
    tard: 3.76
  },
  {
    id: "72927716", ap: "VILLACORTA SALAZAR", nom: "JHOEL", est: "Sede Administrativa",
    car: "PERSONAL III PARA E.I.C.E.", rm: 2800.81, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", tard: 5.50
  },
  {
    id: "47953187", ap: "YALTA CUBAS", nom: "HIBER MILLER", est: "Sede Administrativa",
    car: "PERSONAL III PARA E.I.C.E.", rm: 2800.81, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05"
  },
  {
    id: "74239084", ap: "RUIZ DIAZ", nom: "HLESLY KAREN", est: "Sede Administrativa",
    car: "PERSONAL III PARA E.I.C.E.", rm: 2700, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05"
  },
  {
    id: "80291254", ap: "DIAZ ALTAMIRANO", nom: "ELMER", est: "0084 - 'ANDRES AVELINO CACERES DORREGARAY' - NUEVO LIMA",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "AFP INTEGRA",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "18/05/1978",
    cta: "CTA- 04048763257", ess: "8704211TLSVK001"
  },
  {
    id: "00869370", ap: "DOMINGUEZ AGUILAR", nom: "FRANCISCO", est: "CORPUS CHRISTE - CARHUAPOMA - SAN RAFAEL",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "LEY 19990",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "15/11/1976",
    cta: "CTA- 04542202446", ess: "7611151DIAIF008"
  },
  {
    id: "00868598", ap: "SOLSOL MENDOZA", nom: "PITER", est: "0005 - 'DANIEL ALCIDES CARRION'-SAN RAFAEL",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "LEY 19990",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "16/08/1975",
    cta: "CTA- 04542203183", ess: "7508161SSMDP007"
  },
  {
    id: "43817076", ap: "CASTILLO PEÑAHERRERA", nom: "CARLO MAN", est: "0700 - 'SAN JUAN BAUTISTA' - CARHUAPOMA",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "AFP INTEGRA",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "12/10/1986",
    cta: "CTA- 04542173977", ess: "8610121CTPAC008"
  },
  {
    id: "00882392", ap: "TAPULLIMA SALAS", nom: "KELITH", est: "0760'JOSE SILVERIO OLAYA BALANDRA' LIMON",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "AFP INTEGRA",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "19/08/1972",
    cta: "CTA- 04542174000", ess: "7208190TUSAK007"
  },
  {
    id: "42773088", ap: "SILVA PISCO", nom: "ALFREDO", est: "Sede Administrativa",
    car: "VIGILANTE ITINERANTE", rm: 1150, pen: "AFP PROFUTURO",
    ing: "01/01/2022", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "08/08/1982",
    ess: "9308291PESTA008", coop: 600
  },
  {
    id: "42694564", ap: "CASTILLO PEÑAHERRERA", nom: "AMILCAR", est: "0772'JOSE FAUSTINO SANCHEZ CARRION'BARRANCA",
    car: "PERSONAL DE VIGILANCIA_JEC", rm: 1150, pen: "LEY 19990",
    ing: "01/01/2025", term: "30/09/2025", ley: "CONT. 01-01 AL 30-09", nac: "10/03/1981",
    cta: "CTA- 04542176887", ess: "8103101CTPAA006"
  },
  {
    id: "70350394", ap: "RIOS VELA", nom: "TIFANY BRICETH", est: "E. Nº 0772'José Faustino Sanchez Carrion'",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "8103101CTPAA006"
  },
  {
    id: "73743467", ap: "FERNANDEZ VERA", nom: "JHANYRA ANABEL", est: "I.E Corpus Christi – Carhuapoma -",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "8103101CTPAA006"
  },
  {
    id: "72021717", ap: "GONZALES ODOFREO", nom: "LUIS CARLOS", est: "I.E Nº0005 DANIEL ALCIDES CARRION",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "8103101CTPAA006"
  },
  {
    id: "71475446", ap: "AHUMADA CASTILLO", nom: "ERMY TAYS", est: "I.E Nº0005 DANIEL ALCIDES CARRION",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "8103101CTPAA006"
  },
  {
    id: "45930440", ap: "SAAVEDRA RAMIREZ", nom: "AYDA CRISTINA", est: "0700 - SAN JUAN BAUTISTA",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-09", ess: "8103101CTPAA006"
  },
  {
    id: "71611281", ap: "ALCANTARA SALDAÑA", nom: "MARIA SCARLETH STEFANI", est: "0084 ANDRES AVELINO CACERES DORREGARAY",
    car: "PSICOLOGO", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-09", ess: "8103101CTPAA006"
  },
  {
    id: "44855121", ap: "CAJO ASTONITAS", nom: "MADELIN", est: "I.E Corpus Christi – Carhuapoma",
    car: "CIST", rm: 1350, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "71689978", ap: "SALDAÑA SOTO", nom: "ANGIE PAMELA", est: "IE Nº 0084 \"Andres Avelino Caceres Dorregaray",
    car: "CIST", rm: 1350, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "46711156", ap: "RENGIFO TUESTA", nom: "EDSON ARANTES", est: "IE Nº 0772 \"Jose Faustino Sanchez Carrion",
    car: "CIST", rm: 1350, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "71853259", ap: "INFANTE SALDAÑA", nom: "EDUARDO GABRIEL", est: "0700 - SJB CARHUAPOMA",
    car: "CIST", rm: 1350, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "41721869", ap: "SOTO GRANDEZ", nom: "PIERRE", est: "IE Nº 0005 \"DANIEL ALCIDES CARRION\"",
    car: "CIST", rm: 1350, pen: "AFP PRIMA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "45644104", ap: "SHAHUANO MAITAHUARI", nom: "YURI", est: "477 - FLOR DE CFE",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "11/03/2025", term: "31/08/2025", ley: "CONT. 11-03 AL 31-08", ess: "9308291PESTA008"
  },
  {
    id: "43664053", ap: "SHUPINGAHUA MENDOZA", nom: "MILI", est: "0174 - FAUSA LAMISTA",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "11/03/2025", term: "31/08/2025", ley: "CONT. 11-03 AL 31-08", ess: "9308291PESTA008",
    copac: 438
  },
  {
    id: "00872493", ap: "CARDENAS RUIZ", nom: "SAHIT", est: "137 FE Y ALEGRIA -BELLAVISTA",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "48560530", ap: "BALTAZAR CARRASCO", nom: "FLOR MAGALI", est: "0689 EL CHALLUAL – ALTO BIAVO",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "47827013", ap: "RUIZ CHUJANDAMA", nom: "TELMA ISABEL", est: "0174 \"Rosendo Tapullima Salas\" - Fausa Sapina",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "76388837", ap: "CERCADO BURGA", nom: "DORIS", est: "0008 - Bello Horizonte",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "11/03/2025", term: "31/08/2025", ley: "CONT. 11-03 AL 31-08", ess: "9308291PESTA008"
  },
  {
    id: "42283644", ap: "HUAMAN SANTOS", nom: "ZARITA JANETT", est: "0475 NUEVO PROGRESO",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "77386854", ap: "BALTAZAR CARRASCO", nom: "ANABELA", est: "0002 - ISRAEL URIARTE",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "71499229", ap: "SAAVEDRA SAAVEDRA", nom: "ERICK PAUL", est: "0238 'MANCO CAPAC'",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "45992675", ap: "SANGAMA SALAS", nom: "AMPARO DEL PILAR", est: "0044 - YANAYACU -BAJO BIAVO",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "45829654", ap: "AMASIFEN TUANAMA", nom: "JHON MICHER", est: "0207 'FERNANDO BELAUNDE TERRY'",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "80241199", ap: "GARCIA FLORES", nom: "GLORIA MARLENE", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE LIMPIEZA Y MANTENIMIENTO", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "48475551", ap: "MARRUFO DOMINGUEZ", nom: "MARIELA ARACELI", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "44700499", ap: "HURTADO VILLALOBOS", nom: "SARITA", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "74151185", ap: "JULCAHUANCA DOMINGUEZ", nom: "JORGE LUIS", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE SEGURIDAD", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "27386226", ap: "GONZALES TORO", nom: "MESIAS", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE SEGURIDAD", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "73461637", ap: "TARRILLO OLIVOS", nom: "KEIKO LISETH", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "RESPONSABLE DE BIENESTAR SRE", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "75767132", ap: "HUATANGARI SANCHEZZ", nom: "HYOMIRA", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PERSONAL DE LIMPIEZA Y MANTENIMIENTO", rm: 1130, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "74644899", ap: "PANDURO VELA", nom: "ANGIE MILAGROS", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "COORDINADORA DE RESIDENCIA ESTUDIANTIL", rm: 2500, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "75788378", ap: "FERNANDEZ CHAVEZ", nom: "RIKY MAIK", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "GESTOR SOCIO FAMILIAR", rm: 2201.52, pen: "AFP INTEGRA",
    ing: "06/04/2026", term: "31/05/2026", ley: "CONT. 06-04 AL 31-05", ess: "9308291PESTA008",
    prorated: true
  },
  {
    id: "47021665", ap: "CARHUAJULCA GUEVARA", nom: "JOSE IVAN", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "75788379", ap: "MARTINEZ RAFAEL", nom: "LADY DIANA", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "72507552", ap: "MARIN TORRES", nom: "MARIA ELITA", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "74765743", ap: "MEGO CIEZA", nom: "CLARITA ELIZABETH", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "41612707", ap: "RENGIFO DAVILA", nom: "NIRVANA", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "GESTOR EDUCATIVO", rm: 1400, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "46824840", ap: "TAPULLIMA SALAS", nom: "FRANZ VICTOR", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "GESTOR EDUCATIVO", rm: 1400, pen: "LEY 19990",
    ing: "07/04/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "72843067", ap: "TELLO FLORES", nom: "VALERY ANABEL", est: "I.E HOGAR NAZARET DEL CORAZON INMACULADO DE MARIA",
    car: "GESTOR EDUCATIVO", rm: 2600, pen: "AFP INTEGRA",
    ing: "07/04/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008",
    reint: 889.20, prorated: true
  },
  {
    id: "40925539", ap: "LA TORRE RENGIFO", nom: "SUSANA", est: "RESIDENCIA ESTUDIANTIL NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "43449202", ap: "DIAZ LOPEZ", nom: "TANIA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "LEY 19990",
    ing: "27/03/2026", term: "31/05/2026", ley: "CONT. 27-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "75406261", ap: "RAMIREZ IDROGO", nom: "DEBORA NICOL", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "LEY 19990",
    ing: "27/03/2026", term: "31/05/2026", ley: "CONT. 27-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "42861918", ap: "CASTILLO PEÑAHERRERA", nom: "LUCRECIA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP INTEGRA",
    ing: "27/03/2026", term: "31/05/2026", ley: "CONT. 27-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "47367530", ap: "JARAMILLO HUAMAN", nom: "NEYRI NORITA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "LEY 19990",
    ing: "27/03/2026", term: "31/05/2026", ley: "CONT. 27-03 AL 31-05-26", ess: "9308291PESTA008"
  },
  {
    id: "74634453", ap: "RAMIREZ ISUIZA", nom: "MARY KELLY", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "LEY 19990",
    ing: "27/03/2026", term: "31/05/2026", ley: "CONT. 27-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "45940255", ap: "DIAZ LOPEZ", nom: "LINN KAREN", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTORA DE BIENESTAR", rm: 1400, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "44520693", ap: "DIAZ ESTELA", nom: "ROSA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "GESTOR EDUCATIVO PARA MATEMATICA", rm: 1400, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-08-26", ess: "9308291PESTA008"
  },
  {
    id: "73645285", ap: "ARAUJO ROJAS", nom: "CESAR DAVID", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTOR DE BIENESTAR", rm: 1400, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-08-26", ess: "9308291PESTA008"
  },
  {
    id: "75913156", ap: "RIVERA PERALTA", nom: "THALIA MAYELY", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PROMOTOR DE BIENESTAR", rm: 1400, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-08-26", ess: "9308291PESTA008"
  },
  {
    id: "62745238", ap: "MEZA VENTURA", nom: "ANGELA MISHEL", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "GESTOR EDUCATIVO PARA COMUNICACION", rm: 1400, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-08-26", ess: "9308291PESTA008"
  },
  {
    id: "76679750", ap: "VILLANUEVA SAAVEDRA", nom: "MARIA DE LA CRUZ", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "RESPONSABLE DE BIENESTAR SRE", rm: 2500, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05-26", ess: "9308291PESTA008"
  },
  {
    id: "47680618", ap: "GUEVARA DIAZ", nom: "ARELI LISETT", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "COORDINADORA DE RESIDENCIA ESTUDIANTIL", rm: 2500, pen: "AFP PROFUTURO",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "76244316", ap: "TORRES MALDONADO", nom: "CLARITA MISHEL", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "GESTOR SOCIO FAMILIAR", rm: 2600, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "07565333", ap: "BALBAS MUÑOZ", nom: "RUT", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "GESTOR DE VIDA SALUDABLE SER", rm: 2600, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "60129480", ap: "TUANAMA FASABI", nom: "JACK ERICK", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE SEGURIDAD", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "41612708", ap: "RUIZ ROJAS", nom: "NORBERTA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE LIMPIEZA Y MANTENIMIENTO", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "80443464", ap: "PISCO SOLANO", nom: "ROMER ALEXANDER", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE SEGURIDAD", rm: 1130, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "00850897", ap: "SILVA CARDENAS", nom: "ZOILA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "62509718", ap: "OLANO RUIZ", nom: "ROCIO YAMILETH", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE COCINA", rm: 1030.21, pen: "LEY 19990",
    ing: "03/06/2026", term: "31/08/2026", ley: "CONT. 03-06 AL 31-08", ess: "9308291PESTA008"
  },
  {
    id: "46429184", ap: "SANTA CRUZ FERNANDEZ", nom: "ESMERITA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "62966024", ap: "TABORGA ÑAUPARIN", nom: "LUIS FERNANDO", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "AFP INTEGRA",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "48553957", ap: "TUANAMA CHISTAMA", nom: "CECILIA", est: "I.E HOGAR NAZARET NUESTRA SEÑORA DEL ROCIO",
    car: "PERSONAL DE COCINA", rm: 1130, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  },
  {
    id: "45309798", ap: "ARIRAMA GONZALES", nom: "MEYLI", est: "I.E CORPUS CRISTI",
    car: "LIMPIEZA Y MANTENIMIETO", rm: 1150, pen: "LEY 19990",
    ing: "17/03/2026", term: "31/05/2026", ley: "CONT. 17-03 AL 31-05", ess: "9308291PESTA008"
  }
];

export function getInitialWorkers(): Worker[] {
  return rawWorkers.map((w) => {
    // Determine standard bonuses
    const isProrated = w.prorated === true;
    
    // Incomes
    const incomes: Concept[] = [
      { id: "RM", name: "Remuneración Mensual (RM)", type: "ingreso", amount: w.rm }
    ];
    
    if (w.reint) {
      incomes.push({ id: "Reintegro", name: "Reintegro", type: "ingreso", amount: w.reint });
    }
    
    // Default CAS bonuses in Peru for UGEL Bellavista
    incomes.push({ id: "DS311", name: "D.S. 311", type: "ingreso", amount: isProrated ? 29.96 : 64.19 });
    incomes.push({ id: "DS313", name: "D.S. 313", type: "ingreso", amount: isProrated ? 23.24 : 50.00 });
    incomes.push({ id: "DS265", name: "D.S. 265", type: "ingreso", amount: isProrated ? 23.24 : 50.00 });
    incomes.push({ id: "DS279", name: "D.S. 279", type: "ingreso", amount: isProrated ? 46.62 : 100.00 });
    
    if (w.ds327) {
      incomes.push({ id: "DS327", name: "D.S. 327", type: "ingreso", amount: 100.00 });
    } else {
      incomes.push({ id: "DS317", name: "D.S. 317", type: "ingreso", amount: isProrated ? 46.62 : 100.00 });
    }
    
    // Deductions
    const deductions: Concept[] = [];
    
    // 1. Calculate pension deduction
    const tRemunEstimate = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const isAfp = w.pen.startsWith("AFP");
    
    if (isAfp) {
      // In this sheet, AFP SPP is exactly 11.37% of T-REMUN for most, or custom
      let sppAmount = Math.round(tRemunEstimate * 0.1137 * 100) / 100;
      
      // Particular manual tweaks to match user's values exactly
      if (w.id === "72927716" || w.id === "47953187") {
        sppAmount = 167.93; // Matches prompt's SPP exact deduction
      } else if (w.id === "71611281") {
        sppAmount = 477.63; // Matches prompt's SPP exact deduction
      } else if (w.id === "75788378") {
        sppAmount = 269.61; // Matches prompt's SPP exact deduction
      } else if (w.id === "05373518") {
        sppAmount = 535.46; // Matches Segundo Hipolito's SPP exact deduction
      }
      
      deductions.push({ id: "SPP", name: `SPP (${w.pen})`, type: "egreso", amount: sppAmount });
    } else {
      // ONP/SNP is exactly 13% of T-REMUN
      let snpAmount = Math.round(tRemunEstimate * 0.13 * 100) / 100;
      
      // Particular manual tweaks
      if (w.id === "71853259") {
        snpAmount = 222.84; // Matches Infante Saldaña exact SNP
      } else if (w.id === "48024213") {
        snpAmount = 396.50; // Matches Salazar Castro exact ONP
      } else if (w.id === "72843067") {
        snpAmount = 500.94; // Matches Valery Anabel exact SNP
      } else if (w.id === "74151185") {
        snpAmount = 229.34; // Matches Jorge Luis exact SNP
      }
      
      deductions.push({ id: "SNP", name: "S.N.P. (Ley 19990)", type: "egreso", amount: snpAmount });
    }
    
    // 2. Add other specific monthly deductions
    if (w.coop) {
      deductions.push({ id: "COOP_SCB", name: "Coop S.C.B.", type: "egreso", amount: w.coop });
    }
    if (w.tard) {
      deductions.push({ id: "TARDANZA", name: "Tardanzas / Desc. Horas", type: "egreso", amount: w.tard });
    }
    if (w.cafae) {
      deductions.push({ id: "SUBCAFAE", name: "Sub Cafae", type: "egreso", amount: w.cafae });
    }
    if (w.copac) {
      deductions.push({ id: "COPAC_SAN", name: "Copac San Martín", type: "egreso", amount: w.copac });
    }
    if (w.faltas) {
      deductions.push({ id: "FALTAS", name: "Faltas / Inasistencias", type: "egreso", amount: w.faltas });
    }
    
    return {
      id: w.id,
      dni: w.id,
      apellidos: w.ap,
      nombres: w.nom,
      fechaNacimiento: w.nac || "",
      ruc: `10${w.id}-282001`,
      establecimiento: w.est,
      cargo: w.car,
      tipoServidor: "CONTRATADO",
      regimenLaboral: "12-Ley Nro 1057",
      nivelMag: "A/0-0/40/0",
      tiempoServicio: "--",
      essalud: w.ess || "9308291PESTA008",
      fechaIngreso: w.ing || "17/03/2026",
      fechaTermino: w.term || "31/12/2026",
      ctaAhorro: w.cta || "",
      leyendaPermanente: w.ley || "CONT. 17-03 AL 31-12",
      leyendaMensual: "",
      regimenPensionario: w.pen,
      isHabilitado: true,
      defaultIncomes: incomes,
      defaultDeductions: deductions
    };
  });
}
