export const QUESTIONS: string[] = [
  "Qual seria a pior frase para ouvir durante um primeiro encontro?",
  "Qual seria o pior nome possível para um motel de beira de estrada?",
  "O que você nunca gostaria de ouvir do seu médico logo antes de apagar na anestesia?",
  "Complete a frase: 'Fui demitido hoje porque ______.'",
  "Qual seria o pior superpoder inútil do mundo?",
  "Qual seria a pior coisa para o piloto falar no microfone durante uma turbulência?",
  "Qual seria o nome mais suspeito para uma empresa de segurança privada?",
  "O que você faria de pior se ficasse invisível por exatos 10 minutos?",
  "Qual seria o pior slogan para um restaurante de comida caseira?",
  "O que definitivamente NÃO deveria estar escrito em uma lápide de cemitério?",
  "Qual seria a pior frase para o padre falar na hora do 'sim' em um casamento?",
  "Se você pudesse criar uma lei absurda que todos tivessem que seguir, qual seria?",
  "O que você diria para o extraterrestre para fazê-lo desistir de invadir a Terra?",
  "Qual seria a pior desculpa para chegar 3 horas atrasado no trabalho?",
  "O que uma pessoa poderia fazer em público que te faria fingir que não a conhece?",
  "Qual seria o pior presente de amigo secreto para dar pro seu chefe?",
  "Qual seria a pior mensagem para receber no WhatsApp às 3h da madrugada?",
  "O que você falaria para escapar de um assalto de forma totalmente bizarra?",
  "Qual seria o pior sabor de sorvete já inventado pela humanidade?",
  "Se você fosse preso hoje sem motivo, o que seus amigos achariam que você fez?",
  "O que nunca deve ser dito na reunião de condomínio?",
  "Qual seria o pior tema para uma festa de aniversário infantil?",
  "Qual seria a pior resposta para 'Eu te amo'?",
  "O que você não gostaria de encontrar no bolso do seu casaco novo?",
  "Qual seria o pior conselho amoroso que alguém poderia te dar?",
  "Se você pudesse substituir o aperto de mão por qualquer gesto bizarro, qual seria?",
];

export function getRandomQuestion(): string {
  const index = Math.floor(Math.random() * QUESTIONS.length);
  return QUESTIONS[index];
}
