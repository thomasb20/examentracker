// Examentracker index.js

// Vakkenlijst
const subjects = ["Wiskunde B", "Nederlands", "Engels", "Biologie", "Natuurkunde", "Scheikunde", "Latijn", "Duits"];

for (let i = 0; i < subjects.length; i++){
    const subject = subjects[i];
    const subject_list = document.getElementById("subject-list");
    const listItem = document.createElement("li");
    listItem.textContent = subject;
    subject_list.appendChild(listItem);
}

// Helper functions
function getLink(subject, site) {
    if (site === "alleexamens"){
    // Alle spaties met - vervangen
    return 'https://www.alleexamens.nl/examens/vwo/' + subject.replace(/\s/g, '-') + '/';
    }
    if (site === "examen-centraal"){
    return 'https://www.examen-centraal.nl/niveau/vwo/vak/' + subject.replace(/\s/g, '-') + '/topic';
    }
    else return null;
}

// TODO:
// Invullen SE cijfer per vak
// Streefcijfer per vak uitbereknen (gemiddelde SE cijfer + streefcijfer = 8,5)
// voortgang per vak
// totale voortgang (gemiddelde voortgang van alle vakken)
// Cijfergrafiek. Die bestaat uit een verticale lijn bij het streefcijfer van het vak. De staven worden gegenereerd met de cijfers van de oefenexamens. Blijf oefenen totdat je 2x boven je streefcijfer haalt.