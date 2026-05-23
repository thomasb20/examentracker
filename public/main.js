// Examentracker index.js

// Constanten
const SUBJECTS = ["Wiskunde B", "Nederlands", "Engels", "Biologie", "Natuurkunde", "Scheikunde", "Latijn", "Duits"];

function calculateTargetGrade(seGrade) {
    let target = (8.0 * 2 - seGrade + 0.5);
    if (target > 10) {
        target = 10;
    }
    return target;
}

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
    return 'https://www.alleexamens.nl/examens/VWO/' + subject.replace(/\s/g, '-') + '/';
    }
    if (site === "examen-centraal"){
    return 'https://www.examen-centraal.nl/niveau/vwo/vak/' + subject.replace(/\s/g, '-').toLowerCase() + '/topic';
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

async function updateTotalProgress() {
    const data = await getUserData();
    if (!data) return;
    let totalSubjects = 0;
    let subjectsOnTrack = 0;
    for (const subjectData of data.vakken) {
        totalSubjects++;
        if (subjectData.oefenexamens && Object.keys(subjectData.oefenexamens).length > 0) {
            const exams = Object.entries(subjectData.oefenexamens);
            const grades = exams.map(([name, [grade, date]]) => grade);
            const seGrade = subjectData.se_grade || 8.0;
            const targetGrade = calculateTargetGrade(seGrade);
            let isOnTrack = false;
            for (let i = 1; i < grades.length; i++) {
                if (grades[i] >= targetGrade && grades[i - 1] >= targetGrade) {
                    isOnTrack = true;
                    break;
                }
            }
            if (isOnTrack) {
                subjectsOnTrack++;
            }
        }
    }
    const progressElement = document.getElementById("total-progress");
    const percentage = ((subjectsOnTrack / totalSubjects) * 100).toFixed(1);
    progressElement.textContent = `${percentage}% van de vakken op schema (${subjectsOnTrack} van ${totalSubjects})`;
}

// Cijfergrafiek genereren
function generateGradeGraph(subjectData) {
    const graphContainer = document.getElementById("grade-graph");
    graphContainer.innerHTML = "";
    
    if (!subjectData || !subjectData.oefenexamens || Object.keys(subjectData.oefenexamens).length === 0) {
        graphContainer.innerHTML = "<p>Geen oefenexamens beschikbaar.</p>";
        return;
    }
    
    // Data voorbereiden
    const exams = Object.entries(subjectData.oefenexamens);
    const labels = exams.map(([name, [grade, date]]) => date);
    const grades = exams.map(([name, [grade, date]]) => grade);
    // Cijfers sorteren op datum
    const sortedData = exams.sort((a, b) => new Date(a[1][1]) - new Date(b[1][1]));
    const sortedLabels = sortedData.map(([name, [grade, date]]) => date);
    const sortedGrades = sortedData.map(([name, [grade, date]]) => grade);
    
    // Streefcijfer berekenen
    const seGrade = subjectData.se_grade || 8.0;
    const targetGrade = calculateTargetGrade(seGrade);

    // Kleur bepalen
    function getBarColor(grade, target){
        if (grade >= target) {
            return "rgba(76, 216, 63, 0.7)"; // Groen
        }
        else if (grade >= target - 0.5) {
            return "rgba(255, 206, 86, 0.7)"; // Geel
        }
        else {
            return "rgba(255, 99, 132, 0.7)"; // Rood
        }
    }
    
    // Canvas-element aanmaken
    const canvas = document.createElement("canvas");
    canvas.id = "gradeChart";
    graphContainer.appendChild(canvas);
    
    // Chart.js maken
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: sortedLabels,
            datasets: [
                {
                    label: "Cijfer",
                    data: sortedGrades,
                    backgroundColor: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return getBarColor(value, targetGrade);
                    },
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 2,
                    yAxisID: "y"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },
                title: {
                    display: true,
                    text: "Cijfergrafiek"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: "Cijfer"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Datum"
                    }
                }
            }
        },
        plugins: [
            {
                id: "targetGradeLine",
                afterDatasetsDraw(chart) {
                    const { ctx, chartArea, scales } = chart;
                    const yScale = scales.y;
                    
                    // Bereken positie van streefcijfer lijn
                    const yPixel = yScale.getPixelForValue(targetGrade);
                    
                    // Teken lijn
                    ctx.save();
                    ctx.strokeStyle = "rgba(255, 99, 132, 1)";
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]); // Dashed line
                    ctx.beginPath();
                    ctx.moveTo(chartArea.left, yPixel);
                    ctx.lineTo(chartArea.right, yPixel);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Teken label voor streefcijfer
                    ctx.save();
                    ctx.fillStyle = "rgba(255, 99, 132, 1)";
                    ctx.font = "12px 'Segoe UI'";
                    ctx.fillText(`Streefcijfer: ${targetGrade.toFixed(1)}`, chartArea.left + 5, yPixel - 5);
                    ctx.restore();
                }
            }
        ]
    });

    isTwiceTarget = false;
    for (let i = 1; i < sortedGrades.length; i++) {
        if (sortedGrades[i] >= targetGrade && sortedGrades[i - 1] >= targetGrade) {
            isTwiceTarget = true;
            break;
        }
    }
    return isTwiceTarget;
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
    document.getElementById("target-grade").innerHTML = calculateTargetGrade(newGrade).toFixed(1);

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

    progressElement = document.getElementById("progress");
    isTwiceTarget = generateGradeGraph(subjectData);
    if (isTwiceTarget) {
        progressElement.textContent = "Ja, goed bezig!";
    }
    else{
        progressElement.textContent = "Nee, haal twee keer het streefcijfer om zeker te zijn van slagen.";
    }
    updateTotalProgress();
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
    document.getElementById("weakness-input").value = "";
    showSubjectDetails(subject);
});