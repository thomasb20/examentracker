// Examentracker index.js

// TODO:
// Invullen SE cijfer per vak
// Streefcijfer per vak uitbereknen (gemiddelde SE cijfer + streefcijfer = 8,5)
// invullen oefenexamens per vak met cijfer en datum
// Cijfergrafiek. Die bestaat uit verticale staven per datum. Horizontale lijn bij streefcijfer. De staven worden gegenereerd met de cijfers van de oefenexamens. Blijf oefenen totdat je 2x  na elkaar boven je streefcijfer haalt.
// voortgang per vak: procentuele voortgang richting streefcijfer. Later bedenken hoe deze wordt berekend.
// totale voortgang (gemiddelde voortgang van alle vakken)
// maken, afvinken en verwijderen zwakke punten per vak

// Constanten
const SUBJECTS = ["Wiskunde B", "Nederlands", "Engels", "Biologie", "Natuurkunde", "Scheikunde", "Latijn", "Duits"];

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

// -

// Laad data
async function getUserData(){
      const response = await fetch('/get-data');
      if (!response.ok) {
        alert("Error. Refresh pagina.");
        window.location.href = "./index.html";
        return null;
    }
    return await response.json();
}

// Vakkenlijst maken
for (let i = 0; i < SUBJECTS.length; i++){
    const subject = SUBJECTS[i];
    const subject_list = document.getElementById("subject-list");
    const listItem = document.createElement("li");
    listItem.textContent = subject;
    subject_list.appendChild(listItem);
}
