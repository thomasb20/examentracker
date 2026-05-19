// Examentracker index.js

// TODO:
// Invullen SE cijfer per vak
// Streefcijfer per vak uitbereknen ((SE cijfer + streefcijfer) / 2 = 8,5)
// invullen oefenexamens per vak met cijfer en datum
// Cijfergrafiek. Die bestaat uit verticale staven per datum. Horizontale lijn bij streefcijfer. De staven worden gegenereerd met de cijfers van de oefenexamens. Blijf oefenen totdat je 2x  na elkaar boven je streefcijfer haalt.
// voortgang per vak: procentuele voortgang richting streefcijfer. Later bedenken hoe deze wordt berekend.
// totale voortgang (gemiddelde voortgang van alle vakken)
// maken, afvinken en verwijderen zwakke punten per vak

// Constanten
const SUBJECTS = ["Wiskunde B", "Nederlands", "Engels", "Biologie", "Natuurkunde", "Scheikunde", "Latijn", "Duits"];

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

async function test(){
      const response = await fetch('/test');
    return await response.text();
}
test().then(data => console.log(data));

async function updateSubjectData(subject, key, value) {
    const data = await getUserData();
    if (!data) return;
    const subjectData = data.find(item => item.name === subject);
    if (!subjectData) {
        alert("Fout: Vak niet gevonden.");
        return;
    }
    subjectData[key] = value;
    await fetch('/update-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

// Vak details
async function showSubjectDetails(subject) {
    document.getElementById("subject-name").textContent = subject;
    document.getElementById("subject-detail").style.display = "block";
    const SE_GRADE = await getUserData().then(data => {
        const subjectData = data.find(item => item.name === subject);
        return subjectData ? subjectData.se_grade : 8.0;
    });
    document.getElementById("se-grade").value = SE_GRADE;
    document.getElementById("se-grade").addEventListener("change", (event) => {
        const newGrade = parseFloat(event.target.value);
        updateSubjectData(subject, "se_grade", newGrade);
    });
    document.getElementById("target-grade").value = 8.5*2 - SE_GRADE;
}

// Vakkenlijst maken
for (let i = 0; i < SUBJECTS.length; i++){
    const subject = SUBJECTS[i];
    const subject_details_button = document.createElement("button");
    subject_details_button.textContent = "Selecteer";
    subject_details_button.addEventListener("click", () => {
        showSubjectDetails(subject);
    });

    const subject_list = document.getElementById("subject-list");
    const listItem = document.createElement("li");
    listItem.textContent = subject;
    listItem.appendChild(subject_details_button);
    subject_list.appendChild(listItem);
}