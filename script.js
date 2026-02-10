// State Management
let scenes = JSON.parse(localStorage.getItem('scenes')) || [];
const MAX_CAST_MEMBERS = 10;
let currentCast = [];

// DOM Elements
const sceneForm = document.getElementById('sceneForm');
const castInput = document.getElementById('castInput');
const castTags = document.getElementById('castTags');
const addCastBtn = document.getElementById('addCastBtn');
const masterTableBody = document.querySelector('#masterTable tbody');
const locationBreakdownContainer = document.getElementById('locationBreakdownContainer');
const clearAllBtn = document.getElementById('clearAllData');
const clearFormBtn = document.getElementById('clearFormBtn');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderMainTable();
    renderLocationBreakdowns();
    updateSuggestions();
});

// Event Listeners
addCastBtn.addEventListener('click', addCastMember);
castInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCastMember();
    }
});

sceneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addScene();
});

clearFormBtn.addEventListener('click', resetForm);
clearAllBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to delete all data? This cannot be undone.')) {
        scenes = [];
        saveData();
        renderMainTable();
        renderLocationBreakdowns();
        updateSuggestions();
        showToast('All data cleared');
    }
});

document.getElementById('downloadMasterPdf').addEventListener('click', generateMasterPDF);
document.getElementById('downloadAllBreakdowns').addEventListener('click', generateBreakdownPDF);

// Functions

function addCastMember() {
    const name = castInput.value.trim();
    if (!name) return;

    if (currentCast.length >= MAX_CAST_MEMBERS) {
        showToast('Maximum 10 cast members allowed', true);
        return;
    }

    if (currentCast.includes(name)) {
        showToast('Cast member already added', true);
        return;
    }

    currentCast.push(name);
    renderCastTags();
    castInput.value = '';
    castInput.focus();
}

function removeCastMember(name) {
    currentCast = currentCast.filter(c => c !== name);
    renderCastTags();
}

function renderCastTags() {
    castTags.innerHTML = '';
    
    if (currentCast.length === 0) {
        castTags.innerHTML = '<span class="empty-cast-msg">No cast added yet</span>';
        return;
    }

    currentCast.forEach(member => {
        const tag = document.createElement('div');
        tag.className = 'cast-tag';
        tag.innerHTML = `
            ${member}
            <i class="fa-solid fa-times" onclick="removeCastMember('${member.replace(/'/g, "\\'")}')"></i>
        `;
        castTags.appendChild(tag);
    });
}

function addScene() {
    const sceneNo = document.getElementById('sceneNo').value.trim();
    const location = document.getElementById('location').value.trim();
    const dayNight = document.getElementById('dayNight').value;

    if (!sceneNo || !location) {
        showToast('Please fill in all required fields', true);
        return;
    }

    const newScene = {
        id: Date.now(),
        sceneNo,
        location,
        dayNight,
        cast: [...currentCast]
    };

    scenes.push(newScene);
    saveData();
    
    // Update UI
    renderMainTable();
    renderLocationBreakdowns();
    updateSuggestions();
    
    // Reset Form
    resetForm();
    showToast('Scene added successfully');
}

function resetForm() {
    sceneForm.reset();
    currentCast = [];
    renderCastTags();
    document.getElementById('sceneNo').focus();
}

function deleteScene(id) {
    if(confirm('Delete this scene?')) {
        scenes = scenes.filter(s => s.id !== id);
        saveData();
        renderMainTable();
        renderLocationBreakdowns();
        updateSuggestions();
        showToast('Scene deleted');
    }
}

function saveData() {
    localStorage.setItem('scenes', JSON.stringify(scenes));
}

function renderMainTable() {
    masterTableBody.innerHTML = '';
    const emptyMsg = document.getElementById('emptyMasterMsg');

    if (scenes.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    // Sort by entered order (or could be Scene No if numeric)
    scenes.forEach((scene, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scene.sceneNo}</td>
            <td>${scene.location}</td>
            <td><span class="badge ${scene.dayNight.toLowerCase()}">${scene.dayNight}</span></td>
            <td>${scene.cast.join(', ')}</td>
            <td>
                <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="deleteScene(${scene.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        masterTableBody.appendChild(row);
    });
}

function renderLocationBreakdowns() {
    locationBreakdownContainer.innerHTML = '';
    
    if (scenes.length === 0) {
        locationBreakdownContainer.innerHTML = '<div class="empty-table-msg">Add scenes to see location breakdowns here.</div>';
        return;
    }

    // Group scenes by location
    const grouped = scenes.reduce((acc, scene) => {
        const loc = scene.location;
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(scene);
        return acc;
    }, {});

    Object.keys(grouped).forEach(location => {
        const locationScenes = grouped[location];
        
        const card = document.createElement('div');
        card.className = 'glass-panel breakdown-card'; // Reusing glass-panel styles but simpler
        
        let tableRows = locationScenes.map(scene => `
            <tr>
                <td>${scene.sceneNo}</td>
                <td>${scene.dayNight}</td>
                <td>${scene.cast.join(', ')}</td>
            </tr>
        `).join('');

        card.innerHTML = `
            <div class="breakdown-header">
                <h3><i class="fa-solid fa-map-pin"></i> ${location}</h3>
                <span class="scene-count">${locationScenes.length} Scene(s)</span>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th width="15%">Scene No</th>
                            <th width="20%">Day/Night</th>
                            <th>Cast</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
        locationBreakdownContainer.appendChild(card);
    });
}

function updateSuggestions() {
    const locations = [...new Set(scenes.map(s => s.location))];
    const castMembers = [...new Set(scenes.flatMap(s => s.cast))];

    const locList = document.getElementById('locationSuggestions');
    const castList = document.getElementById('castSuggestions');

    locList.innerHTML = locations.map(l => `<option value="${l}">`).join('');
    castList.innerHTML = castMembers.map(c => `<option value="${c}">`).join('');
}

function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.background = isError ? '#ff7675' : '#333';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// PDF Generation
const { jsPDF } = window.jspdf;

async function generateMasterPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Master Production Schedule', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Scene No", "Location", "Day/Night", "Cast"];
    const tableRows = [];

    scenes.forEach(scene => {
        const sceneData = [
            scene.sceneNo,
            scene.location,
            scene.dayNight,
            scene.cast.join(', ')
        ];
        tableRows.push(sceneData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [108, 92, 231] },
        // Note: Standard fonts don't support Sinhala complex script. 
        // Showing English or transliteration is best, but we will try.
        theme: 'grid',
    });

    doc.save('master_schedule.pdf');
}

function generateBreakdownPDF() {
    const doc = new jsPDF();
    const grouped = scenes.reduce((acc, scene) => {
        const loc = scene.location;
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(scene);
        return acc;
    }, {});

    let yPos = 20;

    doc.setFontSize(18);
    doc.text('Location Breakdowns', 14, yPos);
    yPos += 15;

    const locations = Object.keys(grouped);
    
    locations.forEach((location, index) => {
        if (index > 0) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(108, 92, 231);
        doc.text(`Location: ${location}`, 14, yPos);
        yPos += 10;

        const tableColumn = ["Scene No", "Day/Night", "Cast"];
        const tableRows = grouped[location].map(s => [
            s.sceneNo,
            s.dayNight,
            s.cast.join(', ')
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 206, 201] },
            theme: 'striped',
            margin: { top: 20 }
        });

        // Update yPos for next element if on same page (not applicable here as we page break)
        yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save('location_breakdowns.pdf');
}
