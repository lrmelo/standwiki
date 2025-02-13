document.getElementById('btnCarregar').addEventListener('click', async function() {
  document.getElementById('conteudo').innerHTML = '<p>Carregando...</p>';

  try {
    // 1. Buscar uma página aleatória na Wikipedia
    const wikiRandomUrl = 'https://pt.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=random&rnnamespace=0&rnlimit=1';
    const randomResponse = await fetch(wikiRandomUrl);
    const randomData = await randomResponse.json();
    const randomPage = randomData.query.random[0];
    const title = randomPage.title;
    const pageUrl = "https://pt.wikipedia.org/?curid=" + randomPage.id;

    // 2. Obter o conteúdo completo da página usando prop=extracts (sem exintro)
    const extractUrl = `https://pt.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=&titles=${encodeURIComponent(title)}`;
    const extractResponse = await fetch(extractUrl);
    const extractData = await extractResponse.json();
    const pages = extractData.query.pages;
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId].extract;

    // 3. Enviar título e conteúdo para o backend para obter o resumo
    const statsResponse = await fetch('http://localhost:3000/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    if (!statsResponse.ok) {
      throw new Error('Erro ao obter resumo do backend');
    }
    console.log(statsResponse)
    const statsData = await statsResponse.json();
    const {Poder_de_Destruição, Velocidade, Alcance, Resistência, Precisão, Potencial_de_Desenvolvimento} = statsData;

    // 4. Exibir os resultados na tela
    document.getElementById('conteudo').innerHTML = `
      <h2>${title}</h2>
      <p><strong>Poder de Destruição:</strong> ${Poder_de_Destruição}</p>
      <p><strong>Velocidade:</strong> ${Velocidade}</p>
      <p><strong>Alcance:</strong> ${Alcance}</p>
      <p><strong>Resistência:</strong> ${Resistência}</p>
      <p><strong>Precisão:</strong> ${Precisão}</p>
      <p><strong>Potencial de Desenvolvimento:</strong> ${Potencial_de_Desenvolvimento}</p>

      <hr>
      <h3>Conteúdo extraído da página:</h3>
      <p>${content}</p>
      <p>
        <a href="${pageUrl}" target="_blank">
          Clique aqui para abrir a página completa no Wikipedia
        </a>
      </p>
    `;

    // 5. Criação do Radar Chart usando Chart.js
    // Primeiro, destrói o gráfico anterior se existir (boa prática para não acumular instâncias)
if (window.radarChartInstance) {
  window.radarChartInstance.destroy();
}

const ctx = document.getElementById('myRadarChart').getContext('2d');

// Objeto de mapeamento
const letterMapping = {
  0: 'F',
  1: 'E',
  2: 'D',
  3: 'C',
  4: 'B',
  5: 'A'
};

// Dados numéricos
const data = {
  labels: [
    'Poder de Destruição',
    'Velocidade',
    'Alcance',
    'Resistência',
    'Precisão',
    'Potencial de Desenvolvimento'
  ],
  datasets: [{
    label: 'Atributos',
    data: [
      Poder_de_Destruição,
      Velocidade,
      Alcance,
      Resistência,
      Precisão,
      Potencial_de_Desenvolvimento
    ],
    backgroundColor: 'rgba(54, 162, 235, 0.2)', 
    borderColor: 'rgba(54, 162, 235, 1)',
    borderWidth: 2,
    pointBackgroundColor: 'rgba(54, 162, 235, 1)'
  }]
};

const config = {
  type: 'radar',
  data: data,
  options: {
    scales: {
      // Configuração do eixo radial (r)
      r: {
        min: 0,   // Mínimo 1
        max: 5,   // Máximo 6
        ticks: {
          stepSize: 1,
          // Callback para formatar o valor
          callback: function (value) {
            // Se existir no mapeamento, retorna a letra; caso contrário, retorna o próprio número
            return letterMapping[value];
          }
        }
      }
    }
  }
};

// Cria e guarda a instância do chart
window.radarChartInstance = new Chart(ctx, config);

  } catch (error) {
    console.error("Erro:", error);
    document.getElementById('conteudo').innerHTML = "<p>Ocorreu um erro. Tente novamente.</p>";
  }
});
