// Examentracker index.js

// TODO:
// Cijfergrafiek. Die bestaat uit verticale staven per datum. Horizontale lijn bij streefcijfer. De staven worden gegenereerd met de cijfers van de oefenexamens. Blijf oefenen totdat je 2x  na elkaar boven je streefcijfer haalt.
// voortgang per vak: procentuele voortgang richting streefcijfer. Later bedenken hoe deze wordt berekend.
// totale voortgang (gemiddelde voortgang van alle vakken)

// Constanten
const SUBJECTS = ["Wiskunde B", "Nederlands", "Engels", "Biologie", "Natuurkunde", "Scheikunde", "Latijn", "Duits"];

// Versie
const versionElement = document.getElementById("version");
fetch('/get-version')
    .then(response => response.text())
    .then(version => {
        versionElement.textContent = version;
    })
    .catch(error => {
        console.error('Error fetching version:', error);
        versionElement.textContent = "Error loading version";
    });

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
    const subjectData = data.vakken.find(item => item.name === subject);
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

    // Voeg oefenlinks toe
    const linksContainer = document.getElementById("links");
    linksContainer.innerHTML = "";
    const alleExamensLink = getLink(subject, "alleexamens");
    const examenCentraalLink = getLink(subject, "examen-centraal");
    if (alleExamensLink) {
        const linkElement = document.createElement("a");
        linkElement.href = alleExamensLink;
        linkElement.textContent = "AlleExamens";
        linkElement.target = "_blank";
        linksContainer.appendChild(linkElement);
    }
    if (examenCentraalLink) {
        const linkElement = document.createElement("a");
        linkElement.href = examenCentraalLink;
        linkElement.textContent = "Examen-Centraal";
        linkElement.target = "_blank";
        linksContainer.appendChild(linkElement);
    }

    const SE_GRADE = await getUserData().then(data => {
        const subjectData = data.vakken.find(item => item.name === subject);
        return subjectData ? subjectData.se_grade : 8.0;
    });
    document.getElementById("se-grade").value = SE_GRADE;
    let newGrade = parseFloat(document.getElementById("se-grade").value);
    document.getElementById("se-grade").addEventListener("change", (event) => {
        newGrade = parseFloat(event.target.value);
        updateSubjectData(subject, "se_grade", newGrade);
    });
    document.getElementById("target-grade").value = 8.5*2 - newGrade;

    // Examenlijst
    const examList = document.getElementById("exam-list");
    examList.innerHTML = "";
    const data = await getUserData();
    const subjectData = data.vakken.find(item => item.name === subject);
    if (subjectData && subjectData.oefenexamens) {
        for (const [examKey, [grade, date]] of Object.entries(subjectData.oefenexamens)) {
            const listItem = document.createElement("li");
            listItem.textContent = `${examKey}: ${grade} (${date})`;

            // Verwijder knop
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Verwijder";
            deleteButton.addEventListener("click", async () => {
                delete subjectData.oefenexamens[examKey];
                await fetch('/update-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                showSubjectDetails(subject);
            });

            listItem.appendChild(deleteButton);
            examList.appendChild(listItem);
        }
    }

    // Zwakke punten: checkbox, tekst en verwijderknop
    const weaknessesList = document.getElementById("weaknesses-list");
    weaknessesList.innerHTML = "";
    if (subjectData && subjectData.weaknesses) {
        if (!Array.isArray(subjectData.weaknesses)) {
            subjectData.weaknesses = Object.entries(subjectData.weaknesses).map(([text, selected]) => ({ text, selected }));
        }
        for (const weakness of subjectData.weaknesses) {
            const listItem = document.createElement("li");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = weakness.selected;
            checkbox.addEventListener("change", async () => {
                weakness.selected = checkbox.checked;
                await fetch('/update-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            });
            listItem.appendChild(checkbox);
            const text = document.createElement("span");
            text.textContent = weakness.text;
            listItem.appendChild(text);
            // Verwijderknop
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Verwijder";
            deleteButton.addEventListener("click", async () => {
                subjectData.weaknesses = subjectData.weaknesses.filter(w => w !== weakness);
                await fetch('/update-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                showSubjectDetails(subject);
            });
            listItem.appendChild(deleteButton);
            weaknessesList.appendChild(listItem);
        }
    }
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

// Geselecteerd examen toevoegen
document.getElementById("exam-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const subject = document.getElementById("subject-name").textContent;
    const grade = parseFloat(document.getElementById("exam-grade").value);
    const date = document.getElementById("exam-date").value;
    const name = document.getElementById("exam-name").value;

    const data = await getUserData();
    if (!data) return;
    const subjectData = data.vakken.find(item => item.name === subject);
    if (!subjectData) {
        alert("Fout: Vak niet gevonden.");
        return;
    }
    if (!subjectData.oefenexamens) {
        subjectData.oefenexamens = {};
    }
    // Check of examen al bestaat
    const examKey = `${name}`;
    if (subjectData.oefenexamens[examKey]) {
        alert("Fout: Examen bestaat al.");
        return;
    }

    subjectData.oefenexamens[examKey] = [grade, date];
    await fetch('/update-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    alert("Oefenexamen toegevoegd!");
    document.getElementById("exam-form").reset();
    showSubjectDetails(subject);
});

// Zwak punt toevoegen
document.getElementById("add-weakness").addEventListener("click", async () => {
    const subject = document.getElementById("subject-name").textContent;
    const weaknessText = document.getElementById("weakness-input").value.trim();
    if (!weaknessText) {
        alert("Fout: Zwak punt mag niet leeg zijn.");
        return;
    }
    const data = await getUserData();
    if (!data) return;
    const subjectData = data.vakken.find(item => item.name === subject);
    if (!subjectData) {
        alert("Fout: Vak niet gevonden.");
        return;
    }
    if (!subjectData.weaknesses) {
        subjectData.weaknesses = [];
    }
    else if (!Array.isArray(subjectData.weaknesses)) {
        subjectData.weaknesses = Object.entries(subjectData.weaknesses).map(([text, selected]) => ({ text, selected }));
    }
    subjectData.weaknesses.push({ text: weaknessText, selected: false });
    await fetch('/update-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    alert("Zwak punt toegevoegd!");
    document.getElementById("weakness-input").value = "";
    showSubjectDetails(subject);
});