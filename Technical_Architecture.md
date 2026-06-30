# UMBRA: SANGUINE ECLIPSE
## Arquitetura Técnica e Sistemas de Geolocalização

> [!IMPORTANT]
> Este documento técnico serve como o mapa da infraestrutura de backend e engenharia de software para suportar o UMBRA em escala global.

### 1. Arquitetura de Dados Espaciais e Escalonamento
O núcleo do RPG de geolocalização exige rastreamento e cálculo em tempo real com latência quase nula.
- **Banco de Dados Estrito (A Verdade):** Utilização do `PostgreSQL` com `PostGIS` para manter a integridade transacional (ACID) do mundo, processar geometrias complexas e salvar atributos de usuários.
- **Filtro de Baixa Latência (O Motor em Tempo Real):** Utilização do `Redis GEO` em memória. Ele indexa as posições e resolve intersecções em milissegundos (20 a 50ms) usando `GEOSEARCH`. O servidor bate no Redis para as distâncias e só chama o PostgreSQL para resgatar os atributos complexos se necessário.
- **Data Lakehouse (IA do Diretor de Jogo):** A telemetria e as interações globais não sobrecarregam o banco primário. Elas fluem via Kafka para um *Spatial Data Lakehouse* (Apache Parquet/Iceberg), onde a Inteligência Artificial calcula a progressão narrativa procedural.

### 2. Cartografia Processual (S2 Cells e OSM)
O mapa é gerado processualmente usando a geometria de **Células S2** em diferentes níveis hierárquicos, extraindo dados do *OpenStreetMap (OSM)*.

| Nível S2 | Área Média | Função no Jogo |
| --- | --- | --- |
| L13 | ~663.273 m² | Zonas de Eclipses e Raids (Limita 1 chefe por zona). |
| L14 | ~165.818 m² | Dita o número máximo de Fendas Sombrias (Ginásios). |
| L15 | ~41.454 m² | Bloqueio Militar/Industrial (Prevenção Estrutural). |
| L17 | ~2.590 m² | Densidade de Nexus de Energia (Max. 1 por célula). |
| L20 | ~40 m² | Micro-Spawns (Coordenadas de Daemons noturnos). |

> [!CAUTION]
> **Bloqueio de Geração (Spawn-Blocking):** Propriedades industriais (ex: Refinarias como a REPAR em Araucária), aeroportos e zonas militares ativam um bloqueio intransigente no Nível 15. Nenhuma entidade do jogo deve spawnar para evitar contingências jurídicas e acidentes.

### 3. Defesa Contra Fraudes (Anti-Spoofing)
A fraude de localização (GPS Fake/Spoofing) aniquilaria a macro-política do jogo.
- **Biometria Comportamental (IMU):** O acelerômetro, giroscópio e dinâmica de toque na tela são processados para garantir que há vibração humana (bloqueando emuladores de PC).
- **Machine Learning e Anomalias:** Algoritmos barram velocidade inumana ou teletransporte repentino.
- **Liveness em Raids:** Durante Eclipses críticos, o app pode solicitar um mapeamento rápido (biometria) ou leitura Wi-Fi/Bluetooth do entorno local para garantir presença física do grupo.

### 4. Interface (UI) e Acessibilidade Noturna
- **Proibição do Preto Puro:** O Dark Mode noturno usará `#121212` (Cinza Maciço) em vez de `#000000` (Preto Verdadeiro) para prevenir o efeito *halation* (sangramento visual do texto claro no preto absoluto) em telas OLED.
- **Elevação sem Sombras:** A profundidade na interface noturna será alcançada com transparências sutis brancas sobrepondo o cinza base, em vez de sombreamento drop-shadow que não funciona no escuro.
- **Contraste WCAG 2.2:** Relação estrita de no mínimo 4.5:1 para leituras em texto. Cores como o "Vermelho Sangue" serão levemente insaturadas para não fatigar a retina do jogador.

### 5. Combate D&D: Resolução Síncrona Baseada em Fases
Para resolver o problema do tédio em combates de turnos jogados fisicamente na rua:
- Os jogadores enviam secretamente seus comandos e habilidades.
- A fase se resolve de uma vez só na tela de todo mundo (em segundos), com os virtuais D20 rolando ao mesmo tempo, poupando 70% do tempo ocioso tradicional.
- A tática se faz por uma Grelha Dinâmica One-Tap (toque no alvo exibe posição vantajosa, rotas de flanco, risco de oportunidade).

### 6. Economia Ética e Monetização Híbrida
A estratégia financeira repudia o *Pay-to-Win* (Gacha predador) que arruinaria a política das Facções.
- **Passe do Eclipse (Battle Pass):** Planos bimestrais garantem cosméticos, dados 3D fantásticos e títulos nobiliárquicos para a guilda. Nenhuma vantagem técnica bruta.
- **Intercâmbio de Publicidade nas Tavernas:** Jogadores recuperam o HP/MP mais rápido assistindo interlúdios de anúncios voluntariamente dentro das Tavernas Seguras, garantindo lucro para a desenvolvedora e utilidade lúdica aos players sem ferir as leis de azar.
