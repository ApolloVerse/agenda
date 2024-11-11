 // Estado global da aplicação
            let selectedDate = new Date();
            let notes = JSON.parse(localStorage.getItem('notes')) || [];
            let selectedTags = [];
            let selectedPriority = 'medium';
            const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));

            function toggleCalendarVisibility() {
                const calendar = document.querySelector('.calendar-container');
                calendar.classList.toggle('active');
            }

            document.addEventListener('click', function(e) {
                const calendar = document.querySelector('.calendar-container');
                const toggleBtn = document.querySelector('.toggle-calendar');
                
                if (window.innerWidth <= 768 && 
                    !calendar.contains(e.target) && 
                    !toggleBtn.contains(e.target) &&
                    calendar.classList.contains('active')) {
                    calendar.classList.remove('active');
                }
            });

            function getMonthName(month) {
                return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, month));
            }

            function formatDate(date) {
                return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
            }

            function initializeCalendar() {
                const startYear = 2024;
                const endYear = 2030;
                const yearsContainer = document.getElementById('years-container');
                yearsContainer.innerHTML = '';

                for (let year = startYear; year <= endYear; year++) {
                    const yearElement = createYearElement(year);
                    yearsContainer.appendChild(yearElement);
                }
            }

            function createYearElement(year) {
                const yearDiv = document.createElement('div');
                yearDiv.className = 'year-accordion';
                
                const yearHeader = document.createElement('div');
                yearHeader.className = 'year-header';
                yearHeader.textContent = year;
                yearHeader.onclick = () => toggleYear(yearDiv);

                const monthsContainer = document.createElement('div');
                monthsContainer.className = 'months-container';
                monthsContainer.style.display = 'none';

                for (let month = 0; month < 12; month++) {
                    const monthElement = createMonthElement(year, month);
                    monthsContainer.appendChild(monthElement);
                }

                yearDiv.appendChild(yearHeader);
                yearDiv.appendChild(monthsContainer);
                return yearDiv;
            }

            function createMonthElement(year, month) {
                const monthDiv = document.createElement('div');
                monthDiv.className = 'month-accordion';
                
                const monthHeader = document.createElement('div');
                monthHeader.className = 'month-header';
                monthHeader.textContent = getMonthName(month);
                monthHeader.onclick = () => toggleMonth(monthDiv);

                const daysContainer = document.createElement('div');
                daysContainer.className = 'days-container';
                daysContainer.style.display = 'none';

                const daysGrid = createDaysGrid(year, month);
                daysContainer.appendChild(daysGrid);

                monthDiv.appendChild(monthHeader);
                monthDiv.appendChild(daysContainer);
                return monthDiv;
            }

            function createDaysGrid(year, month) {
                const grid = document.createElement('div');
                grid.className = 'days-grid';

                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDay = firstDay.getDay();
                const totalDays = lastDay.getDate();

                // Add empty cells for days before the first day of the month
                for (let i = 0; i < startDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'day empty';
                    grid.appendChild(emptyDay);
                }

                // Add days of the month
                for (let day = 1; day <= totalDays; day++) {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'day';
                    dayElement.textContent = day;
                    
                    const currentDate = new Date(year, month, day);
                    const hasNote = notes.some(note => new Date(note.date).toDateString() === currentDate.toDateString());
                    
                    if (hasNote) {
                        dayElement.classList.add('has-note');
                    }

                    dayElement.onclick = () => selectDate(year, month, day);
                    grid.appendChild(dayElement);
                }

                return grid;
            }

            function toggleYear(yearDiv) {
                const monthsContainer = yearDiv.querySelector('.months-container');
                const isVisible = monthsContainer.style.display === 'block';
                monthsContainer.style.display = isVisible ? 'none' : 'block';
            }

            function toggleMonth(monthDiv) {
                const daysContainer = monthDiv.querySelector('.days-container');
                const isVisible = daysContainer.style.display === 'block';
                daysContainer.style.display = isVisible ? 'none' : 'block';
            }

            function selectDate(year, month, day) {
                selectedDate = new Date(year, month, day);
                updateNotesList();
                showAddNoteModal();
            }

            function showAddNoteModal(existingNote = null) {
                if (existingNote) {
                    document.getElementById('noteTitle').value = existingNote.title;
                    document.getElementById('noteText').value = existingNote.text;
                    selectedPriority = existingNote.priority;
                    selectedTags = [...existingNote.tags];
                    updateTagsDisplay();
                } else {
                    document.getElementById('noteTitle').value = '';
                    document.getElementById('noteText').value = '';
                    selectedPriority = 'medium';
                    selectedTags = [];
                    updateTagsDisplay();
                }
                
                updatePrioritySelection();
                noteModal.show();
            }

            function selectPriority(priority) {
                selectedPriority = priority;
                updatePrioritySelection();
            }

            function updatePrioritySelection() {
                document.querySelectorAll('.priority-option').forEach(option => {
                    option.classList.toggle('selected', option.dataset.priority === selectedPriority);
                });
            }

            function saveNote() {
                const title = document.getElementById('noteTitle').value.trim();
                const text = document.getElementById('noteText').value.trim();
                const imageInput = document.getElementById('noteImage');
                
                if (!title || !text) {
                    alert('Por favor, preencha título e descrição.');
                    return;
                }

                const note = {
                    id: Date.now(),
                    date: selectedDate,
                    title,
                    text,
                    priority: selectedPriority,
                    tags: selectedTags,
                    image: null
                };

                if (imageInput.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        note.image = e.target.result;
                        saveNoteToStorage(note);
                    };
                    reader.readAsDataURL(imageInput.files[0]);
                } else {
                    saveNoteToStorage(note);
                }
            }

            function saveNoteToStorage(note) {
                notes.push(note);
                localStorage.setItem('notes', JSON.stringify(notes));
                noteModal.hide();
                updateNotesList();
                initializeCalendar(); // Refresh calendar to show new note indicators
            }

            function updateNotesList(filter = 'all') {
                const notesContainer = document.getElementById('notes-list');
                notesContainer.innerHTML = '';

                let filteredNotes = notes;
                if (filter === 'urgent') {
                    filteredNotes = notes.filter(note => note.priority === 'high');
                } else if (filter === 'upcoming') {
                    const today = new Date();
                    filteredNotes = notes.filter(note => new Date(note.date) >= today);
                }

                filteredNotes.sort((a, b) => {
                    const priorityValues = { high: 1, medium: 2, low: 3 };
                    return priorityValues[a.priority] - priorityValues[b.priority];
                });

                filteredNotes.forEach(note => {
                    const noteCard = createNoteCard(note);
                    notesContainer.appendChild(noteCard);
                });
            }

            function createNoteCard(note) {
                const card = document.createElement('div');
                card.className = `note-card priority-${note.priority}`;
                
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0">${note.title}</h6>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary" onclick="editNote(${note.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteNote(${note.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="small mb-2">${formatDate(note.date)}</p>
                    <p class="mb-2">${note.text}</p>
                    ${note.tags.length ? `
                        <div class="tags mb-2">
                            ${note.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${note.image ? `
                        <div class="note-image">
                            <img src="${note.image}" alt="Note attachment">
                        </div>
                    ` : ''}
                `;
                
                return card;
            }

            function editNote(noteId) {
                const note = notes.find(n => n.id === noteId);
                if (note) {
                    selectedDate = new Date(note.date);
                    showAddNoteModal(note);
                }
            }

            function deleteNote(noteId) {
                if (confirm('Tem certeza que deseja excluir esta nota?')) {
                    notes = notes.filter(note => note.id !== noteId);
                    localStorage.setItem('notes', JSON.stringify(notes));
                    updateNotesList();
                    initializeCalendar();
                }
            }

            function filterNotes(filter) {
                updateNotesList(filter);
            }

            // Initialize the application
            document.addEventListener('DOMContentLoaded', () => {
                initializeCalendar();
                updateNotesList();
                
                // Setup tags input
                const tagsInput = document.getElementById('noteTags');
                tagsInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && tagsInput.value.trim()) {
                        e.preventDefault();
                        const tag = tagsInput.value.trim();
                        if (!selectedTags.includes(tag)) {
                            selectedTags.push(tag);
                            updateTagsDisplay();
                        }
                        tagsInput.value = '';
                    }
                });
            });

            function updateTagsDisplay() {
                const container = document.getElementById('tagsContainer');
                container.innerHTML = selectedTags.map(tag => `
                    <span class="badge bg-secondary me-1 mb-1">
                        ${tag}
                        <i class="fas fa-times ms-1" onclick="removeTag('${tag}')"></i>
                    </span>
                `).join('');
            }

            function removeTag(tag) {
                selectedTags = selectedTags.filter(t => t !== tag);
                updateTagsDisplay();
            }
            function showToast(message, type = 'success') {
                const toastContainer = document.querySelector('.toast-container') || createToastContainer();
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                        <div>${message}</div>
                    </div>
                `;
                
                toastContainer.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }

            function createToastContainer() {
                const container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
                return container;
            }

            // Modify saveNoteToStorage to include notification
            function saveNoteToStorage(note) {
                notes.push(note);
                localStorage.setItem('notes', JSON.stringify(notes));
                noteModal.hide();
                updateNotesList();
                initializeCalendar();
                showToast('Nota salva com sucesso!');
            }

            // Modify deleteNote to include notification
            function deleteNote(noteId) {
                if (confirm('Tem certeza que deseja excluir esta nota?')) {
                    notes = notes.filter(note => note.id !== noteId);
                    localStorage.setItem('notes', JSON.stringify(notes));
                    updateNotesList();
                    initializeCalendar();
                    showToast('Nota excluída com sucesso!');
                }
            }

            // Add error handling to note saving
            function saveNote() {
                const title = document.getElementById('noteTitle').value.trim();
                const text = document.getElementById('noteText').value.trim();
                const imageInput = document.getElementById('noteImage');
                
                if (!title || !text) {
                    showToast('Por favor, preencha título e descrição.', 'error');
                    return;
                }

                try {
                    const note = {
                        id: Date.now(),
                        date: selectedDate,
                        title,
                        text,
                        priority: selectedPriority,
                        tags: selectedTags,
                        image: null
                    };

                    if (imageInput.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            note.image = e.target.result;
                            saveNoteToStorage(note);
                        };
                        reader.onerror = function() {
                            showToast('Erro ao carregar imagem.', 'error');
                        };
                        reader.readAsDataURL(imageInput.files[0]);
                    } else {
                        saveNoteToStorage(note);
                    }
                } catch (error) {
                    showToast('Erro ao salvar nota.', 'error');
                    console.error('Error saving note:', error);
                }
            }

            // Add empty state handling
            function updateNotesList(filter = 'all') {
                const notesContainer = document.getElementById('notes-list');
                notesContainer.innerHTML = '';

                let filteredNotes = notes;
                if (filter === 'urgent') {
                    filteredNotes = notes.filter(note => note.priority === 'high');
                } else if (filter === 'upcoming') {
                    const today = new Date();
                    filteredNotes = notes.filter(note => new Date(note.date) >= today);
                }

                if (filteredNotes.length === 0) {
                    notesContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-sticky-note"></i>
                            <h5>Nenhuma nota encontrada</h5>
                            <p>Clique no botão + para adicionar uma nova nota</p>
                        </div>
                    `;
                    return;
                }

                filteredNotes.sort((a, b) => {
                    const priorityValues = { high: 1, medium: 2, low: 3 };
                    return priorityValues[a.priority] - priorityValues[b.priority];
                });

                filteredNotes.forEach(note => {
                    const noteCard = createNoteCard(note);
                    notesContainer.appendChild(noteCard);
                });
            }





