// Основной класс GameDev Notebook PRO
class GameDevNotebookPro {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('gamedevNotes')) || [];
        this.milestones = JSON.parse(localStorage.getItem('gamedevMilestones')) || [];
        this.connections = JSON.parse(localStorage.getItem('gamedevConnections')) || [];
        this.settings = JSON.parse(localStorage.getItem('gamedevSettings')) || {
            githubToken: '',
            githubRepo: '',
            autoSave: true
        };
        
        this.currentNote = null;
        this.currentType = null;
        this.selectedDate = new Date();
        this.filteredNotes = [];
        this.currentFilters = {
            type: 'all',
            priority: 'all',
            genre: 'all',
            tags: [],
            search: ''
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadNotes();
        this.updateStats();
        this.generateCalendar();
        this.loadPopularTags();
        this.setupCharts();
        this.setupTabs();
        
        // Автосохранение каждые 30 секунд
        if (this.settings.autoSave) {
            setInterval(() => this.saveToLocalStorage(), 30000);
        }
    }
    
    setupEventListeners() {
        // Кнопки создания
        document.getElementById('newIdea').addEventListener('click', () => this.openModal('idea'));
        document.getElementById('newMechanic').addEventListener('click', () => this.openModal('mechanic'));
        document.getElementById('newTemplate').addEventListener('click', () => this.openTemplateModal());
        
        // Управление
        document.getElementById('saveAll').addEventListener('click', () => this.saveToLocalStorage());
        document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());
        document.getElementById('importBtn').addEventListener('click', () => this.importFromFile());
        document.getElementById('githubSync').addEventListener('click', () => this.openGithubModal());
        
        // Поиск и фильтры
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.currentFilters.search = '';
            this.applyFilters();
        });
        
        document.getElementById('filterType').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filterPriority').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filterGenre').addEventListener('change', (e) => {
            this.currentFilters.genre = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('tagFilter').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.currentFilters.tags.push(e.target.value.trim());
                this.updateActiveTags();
                e.target.value = '';
                this.applyFilters();
            }
        });
        
        // Быстрые фильтры
        document.querySelectorAll('.quick-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.closest('.quick-filter').dataset.filter;
                this.applyQuickFilter(filter);
            });
        });
        
        // Сортировка
        document.getElementById('sortByRating').addEventListener('click', () => this.sortBy('rating'));
        document.getElementById('sortByDate').addEventListener('click', () => this.sortBy('date'));
        
        // Категории механик
        document.getElementById('mechanicCategory').addEventListener('change', (e) => {
            this.currentFilters.mechanicCategory = e.target.value;
            this.applyFilters();
        });
        
        // Календарь
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Таймлайн
        document.getElementById('addMilestone').addEventListener('click', () => this.addMilestone());
        document.getElementById('generateRoadmap').addEventListener('click', () => this.generateRoadmap());
        
        // Модальные окна
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => this.closeAllModals());
        });
        
        document.querySelector('.close-template').addEventListener('click', () => {
            document.getElementById('templateModal').style.display = 'none';
        });
        
        document.querySelector('.close-github').addEventListener('click', () => {
            document.getElementById('githubModal').style.display = 'none';
        });
        
        document.querySelector('.close-export').addEventListener('click', () => {
            document.getElementById('exportModal').style.display = 'none';
        });
        
        document.getElementById('cancelNote').addEventListener('click', () => this.closeModal());
        document.getElementById('saveNote').addEventListener('click', () => this.saveNote());
        
        // Рейтинг
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
        
        // Теги
        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });
        
        // Вложения
        document.getElementById('attachFile').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => this.addAttachment(file));
        });
        
        // GitHub
        document.getElementById('testGithub').addEventListener('click', () => this.testGithubConnection());
        document.getElementById('syncToGithub').addEventListener('click', () => this.syncToGithub());
        document.getElementById('loadFromGithub').addEventListener('click', () => this.loadFromGithub());
        
        // Экспорт
        document.getElementById('exportPreview').addEventListener('click', () => this.showExportPreview());
        document.getElementById('exportExecute').addEventListener('click', () => this.executeExport());
        
        // Шаблоны
        document.querySelectorAll('.use-template').forEach(button => {
            button.addEventListener('click', (e) => {
                const template = e.target.closest('.template-card').dataset.template;
                this.useTemplate(template);
            });
        });
        
        // Закрытие модальных окон по клику вне
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Обработка горячих клавиш
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveToLocalStorage();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.openModal('idea');
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput').focus();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.openExportModal();
                        break;
                }
            }
        });
    }
    
    setupTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                
                // Убираем активный класс у всех вкладок
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Добавляем активный класс текущей вкладке
                e.currentTarget.classList.add('active');
                document.getElementById(`${tabName}Tab`).classList.add('active');
                
                // Загружаем контент вкладки
                if (tabName === 'timeline') {
                    this.loadTimeline();
                } else if (tabName === 'connections') {
                    this.drawConnectionsGraph();
                }
            });
        });
    }
    
    setupCharts() {
        const ctx = document.getElementById('statsChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Идеи', 'Механики', 'Высокий приоритет', 'В работе'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#ff7e5f',
                        '#36d1dc',
                        '#ff4757',
                        '#00b894'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    updateStats() {
        const ideas = this.notes.filter(n => n.type === 'idea');
        const mechanics = this.notes.filter(n => n.type === 'mechanic');
        const highPriority = this.notes.filter(n => n.priority === 'high');
        const inProgress = this.notes.filter(n => n.status === 'inprogress');
        
        document.getElementById('totalNotes').textContent = this.notes.length;
        document.getElementById('highPriority').textContent = highPriority.length;
        document.getElementById('ideasCount').textContent = ideas.length;
        document.getElementById('mechanicsCount').textContent = mechanics.length;
        
        document.getElementById('ideasBadge').textContent = ideas.length;
        document.getElementById('mechanicsBadge').textContent = mechanics.length;
        document.getElementById('timelineBadge').textContent = this.milestones.length;
        document.getElementById('connectionsBadge').textContent = this.connections.length;
        
        // Обновляем график
        if (this.chart) {
            this.chart.data.datasets[0].data = [
                ideas.length,
                mechanics.length,
                highPriority.length,
                inProgress.length
            ];
            this.chart.update();
        }
    }
    
    loadNotes() {
        this.applyFilters();
        this.updateStats();
    }
    
    applyFilters() {
        this.filteredNotes = this.notes.filter(note => {
            // Фильтр по типу
            if (this.currentFilters.type !== 'all' && note.type !== this.currentFilters.type) {
                return false;
            }
            
            // Фильтр по приоритету
            if (this.currentFilters.priority !== 'all' && note.priority !== this.currentFilters.priority) {
                return false;
            }
            
            // Фильтр по жанру
            if (this.currentFilters.genre !== 'all' && note.genre !== this.currentFilters.genre) {
                return false;
            }
            
            // Фильтр по тегам
            if (this.currentFilters.tags.length > 0) {
                const hasAllTags = this.currentFilters.tags.every(tag => 
                    note.tags.includes(tag)
                );
                if (!hasAllTags) return false;
            }
            
            // Фильтр по категории механик
            if (note.type === 'mechanic' && this.currentFilters.mechanicCategory && 
                this.currentFilters.mechanicCategory !== 'all' && 
                note.category !== this.currentFilters.mechanicCategory) {
                return false;
            }
            
            // Поиск
            if (this.currentFilters.search) {
                const searchLower = this.currentFilters.search.toLowerCase();
                const inTitle = note.title.toLowerCase().includes(searchLower);
                const inContent = note.content.toLowerCase().includes(searchLower);
                const inTags = note.tags.some(tag => tag.toLowerCase().includes(searchLower));
                
                if (!(inTitle || inContent || inTags)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderNotes();
    }
    
    applyQuickFilter(filterString) {
        const [type, value] = filterString.split(':');
        
        switch(type) {
            case 'priority':
                this.currentFilters.priority = value;
                document.getElementById('filterPriority').value = value;
                break;
            case 'type':
                this.currentFilters.type = value;
                document.getElementById('filterType').value = value;
                break;
            case 'status':
                // Нужно будет добавить фильтр по статусу в модальном окне
                break;
        }
        
        this.applyFilters();
    }
    
    updateActiveTags() {
        const container = document.getElementById('activeTags');
        container.innerHTML = '';
        
        this.currentFilters.tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'active-tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="remove-tag" onclick="notebook.removeFilterTag('${tag}')">✕</span>
            `;
            container.appendChild(tagElement);
        });
    }
    
    removeFilterTag(tag) {
        this.currentFilters.tags = this.currentFilters.tags.filter(t => t !== tag);
        this.updateActiveTags();
        this.applyFilters();
    }
    
    sortBy(criteria) {
        this.filteredNotes.sort((a, b) => {
            switch(criteria) {
                case 'rating':
                    return b.rating - a.rating;
                case 'date':
                    return new Date(b.updated) - new Date(a.updated);
                default:
                    return 0;
            }
        });
        
        this.renderNotes();
    }
    
    renderNotes() {
        const ideasContainer = document.getElementById('ideasContainer');
        const mechanicsContainer = document.getElementById('mechanicsContainer');
        
        ideasContainer.innerHTML = '';
        mechanicsContainer.innerHTML = '';
        
        const ideas = this.filteredNotes.filter(n => n.type === 'idea');
        const mechanics = this.filteredNotes.filter(n => n.type === 'mechanic');
        
        ideas.forEach(note => {
            ideasContainer.appendChild(this.createNoteCard(note));
        });
        
        mechanics.forEach(note => {
            mechanicsContainer.appendChild(this.createNoteCard(note));
        });
        
        if (ideas.length === 0) {
            ideasContainer.innerHTML = '<div class="empty-state">Нет идей, соответствующих фильтрам</div>';
        }
        
        if (mechanics.length === 0) {
            mechanicsContainer.innerHTML = '<div class="empty-state">Нет механик, соответствующих фильтрам</div>';
        }
    }
    
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = `note-card ${note.type} ${note.priority}`;
        card.dataset.id = note.id;
        
        const date = new Date(note.date);
        const updated = new Date(note.updated);
        const genreNames = {
            rpg: 'RPG', shooter: 'Шутер', strategy: 'Стратегия',
            adventure: 'Приключение', simulator: 'Симулятор',
            puzzle: 'Головоломка', platformer: 'Платформер',
            horror: 'Хоррор', mmo: 'MMO', roguelike: 'Roguelike'
        };
        
        const statusNames = {
            todo: 'В ожидании', inprogress: 'В разработке',
            completed: 'Завершено', abandoned: 'Отложено'
        };
        
        const priorityNames = {
            low: 'Низкий', medium: 'Средний', high: 'Высокий'
        };
        
        card.innerHTML = `
            <div class="note-header">
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-badges">
                    ${note.genre ? `<span class="note-badge badge-genre">${genreNames[note.genre] || note.genre}</span>` : ''}
                    ${note.status ? `<span class="note-badge badge-status">${statusNames[note.status]}</span>` : ''}
                    <span class="note-badge badge-priority">${priorityNames[note.priority]}</span>
                </div>
            </div>
            
            <div class="note-meta">
                ${note.rating ? `<span class="note-rating">★ ${note.rating}/5</span>` : ''}
                ${note.complexity ? `<span class="note-complexity">Сложность: ${note.complexity}/10</span>` : ''}
                ${note.timeEstimate ? `<span>Время: ${note.timeEstimate} ${this.getTimeUnitName(note.timeUnit)}</span>` : ''}
            </div>
            
            <div class="note-content">${this.escapeHtml(note.content.substring(0, 300))}${note.content.length > 300 ? '...' : ''}</div>
            
            ${note.tags && note.tags.length ? `
                <div class="note-tags">
                    ${note.tags.map(tag => 
                        `<span class="tag ${note.type}-tag">${this.escapeHtml(tag)}</span>`
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="note-footer">
                <div class="note-date">
                    Создано: ${date.toLocaleDateString('ru-RU')}<br>
                    Обновлено: ${updated.toLocaleDateString('ru-RU')}
                </div>
                <div class="note-actions">
                    <button class="note-action-btn" onclick="notebook.editNote(${note.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action-btn delete-btn" onclick="notebook.deleteNote(${note.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    openModal(type, note = null) {
        this.currentNote = note;
        this.currentType = type;
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        
        // Заполняем связанные записи
        this.populateConnectionsSelect();
        
        if (note) {
            title.textContent = 'Редактировать запись';
            document.getElementById('noteType').value = note.type;
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteGenre').value = note.genre || '';
            document.getElementById('noteStatus').value = note.status || 'todo';
            document.getElementById('notePriority').value = note.priority || 'medium';
            document.getElementById('noteRating').value = note.rating || 3;
            document.getElementById('noteComplexity').value = note.complexity || 5;
            document.getElementById('noteTimeEstimate').value = note.timeEstimate || 1;
            document.getElementById('noteTimeUnit').value = note.timeUnit || 'hours';
            
            // Устанавливаем рейтинг
            this.setRating(note.rating || 3);
            
            // Загружаем теги
            document.getElementById('tagsContainer').innerHTML = '';
            (note.tags || []).forEach(tag => this.addTagToInput(tag));
            
            // Загружаем связи
            document.getElementById('connectionsContainer').innerHTML = '';
            (note.connections || []).forEach(connId => {
                const connNote = this.notes.find(n => n.id === connId);
                if (connNote) this.addConnectionToInput(connId, connNote.title);
            });
            
            // Загружаем вложения
            document.getElementById('attachmentsContainer').innerHTML = '';
            (note.attachments || []).forEach(att => this.addAttachmentToInput(att));
        } else {
            title.textContent = type === 'idea' ? 'Новая идея игры' : 'Новая механика';
            document.getElementById('noteType').value = type;
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            document.getElementById('noteGenre').value = '';
            document.getElementById('noteStatus').value = 'todo';
            document.getElementById('notePriority').value = 'medium';
            document.getElementById('noteRating').value = 3;
            document.getElementById('noteComplexity').value = 5;
            document.getElementById('noteTimeEstimate').value = 1;
            document.getElementById('noteTimeUnit').value = 'hours';
            document.getElementById('tagsContainer').innerHTML = '';
            document.getElementById('connectionsContainer').innerHTML = '';
            document.getElementById('attachmentsContainer').innerHTML = '';
            
            this.setRating(3);
            this.updateComplexityValue();
        }
        
        // Обновляем сложность
        document.getElementById('noteComplexity').addEventListener('input', () => this.updateComplexityValue());
        
        modal.style.display = 'flex';
        document.getElementById('noteTitle').focus();
    }
    
    setRating(rating) {
        document.getElementById('noteRating').value = rating;
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    updateComplexityValue() {
        const value = document.getElementById('noteComplexity').value;
        document.getElementById('complexityValue').textContent = `${value}/10`;
    }
    
    addTag(tagText) {
        const tagsContainer = document.getElementById('tagsContainer');
        if (Array.from(tagsContainer.children).some(tag => 
            tag.querySelector('span:first-child').textContent === tagText)) {
            return; // Тег уже существует
        }
        
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-input-tag';
        tagDiv.innerHTML = `
            <span>${this.escapeHtml(tagText)}</span>
            <span class="remove-tag" onclick="this.parentElement.remove()">✕</span>
        `;
        tagsContainer.appendChild(tagDiv);
    }
    
    addTagToInput(tagText) {
        const tagsContainer = document.getElementById('tagsContainer');
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-input-tag';
        tagDiv.innerHTML = `
            <span>${this.escapeHtml(tagText)}</span>
            <span class="remove-tag" onclick="this.parentElement.remove()">✕</span>
        `;
        tagsContainer.appendChild(tagDiv);
    }
    
    populateConnectionsSelect() {
        const select = document.getElementById('connectionSelect');
        select.innerHTML = '<option value="">Выберите связанную запись...</option>';
        
        this.notes.filter(note => !this.currentNote || note.id !== this.currentNote.id)
            .forEach(note => {
                const option = document.createElement('option');
                option.value = note.id;
                option.textContent = `[${note.type === 'idea' ? 'Идея' : 'Механика'}] ${note.title}`;
                select.appendChild(option);
            });
        
        document.getElementById('addConnection').addEventListener('click', () => {
            const select = document.getElementById('connectionSelect');
            const noteId = parseInt(select.value);
            const note = this.notes.find(n => n.id === noteId);
            
            if (note && noteId) {
                this.addConnectionToInput(noteId, note.title);
                select.value = '';
            }
        });
    }
    
    addConnectionToInput(noteId, noteTitle) {
        const container = document.getElementById('connectionsContainer');
        
        if (Array.from(container.children).some(conn => 
            conn.dataset.id === noteId.toString())) {
            return; // Связь уже существует
        }
        
        const connDiv = document.createElement('div');
        connDiv.className = 'connection-item';
        connDiv.dataset.id = noteId;
        connDiv.innerHTML = `
            <span>${this.escapeHtml(noteTitle)}</span>
            <span class="remove-tag" onclick="this.parentElement.remove()">✕</span>
        `;
        container.appendChild(connDiv);
    }
    
    addAttachment(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const attachment = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result.split(',')[1],
                date: new Date().toISOString()
            };
            
            this.addAttachmentToInput(attachment);
        };
        reader.readAsDataURL(file);
    }
    
    addAttachmentToInput(attachment) {
        const container = document.getElementById('attachmentsContainer');
        const attDiv = document.createElement('div');
        attDiv.className = 'attachment-item';
        attDiv.innerHTML = `
            <div class="attachment-info">
                <i class="fas fa-paperclip attachment-icon"></i>
                <span>${this.escapeHtml(attachment.name)} (${this.formatFileSize(attachment.size)})</span>
            </div>
            <span class="remove-attachment" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </span>
        `;
        container.appendChild(attDiv);
    }
    
    getTagsFromInput() {
        const tags = [];
        document.querySelectorAll('#tagsContainer .tag-input-tag span:first-child').forEach(tag => {
            tags.push(tag.textContent.trim());
        });
        return tags;
    }
    
    getConnectionsFromInput() {
        const connections = [];
        document.querySelectorAll('#connectionsContainer .connection-item').forEach(conn => {
            connections.push(parseInt(conn.dataset.id));
        });
        return connections;
    }
    
    getAttachmentsFromInput() {
        // В реальном приложении здесь была бы логика обработки файлов
        return [];
    }
    
    saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const type = document.getElementById('noteType').value;
        const genre = document.getElementById('noteGenre').value;
        const status = document.getElementById('noteStatus').value;
        const priority = document.getElementById('notePriority').value;
        const rating = parseInt(document.getElementById('noteRating').value);
        const complexity = parseInt(document.getElementById('noteComplexity').value);
        const timeEstimate = parseInt(document.getElementById('noteTimeEstimate').value);
        const timeUnit = document.getElementById('noteTimeUnit').value;
        const tags = this.getTagsFromInput();
        const connections = this.getConnectionsFromInput();
        const attachments = this.getAttachmentsFromInput();
        
        if (!title || !content) {
            this.showNotification('Пожалуйста, заполните название и содержание', 'error');
            return;
        }
        
        const note = {
            id: this.currentNote ? this.currentNote.id : Date.now(),
            type,
            title,
            content,
            genre,
            status,
            priority,
            rating,
            complexity,
            timeEstimate,
            timeUnit,
            tags,
            connections,
            attachments,
            date: this.currentNote ? this.currentNote.date : new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        if (this.currentNote) {
            const index = this.notes.findIndex(n => n.id === this.currentNote.id);
            this.notes[index] = note;
            
            // Обновляем связи в связанных записях
            this.updateConnections(note);
        } else {
            this.notes.push(note);
        }
        
        this.loadNotes();
        this.saveToLocalStorage();
        this.closeModal();
        this.showNotification('Запись сохранена!', 'success');
    }
    
    updateConnections(note) {
        // Удаляем старые связи
        this.connections = this.connections.filter(conn => 
            conn.from !== note.id && conn.to !== note.id
        );
        
        // Добавляем новые связи
        note.connections.forEach(connectedId => {
            this.connections.push({
                id: Date.now() + Math.random(),
                from: note.id,
                to: connectedId,
                type: 'related'
            });
        });
    }
    
    editNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            this.openModal(note.type, note);
        }
    }
    
    deleteNote(id) {
        if (confirm('Удалить эту запись?')) {
            this.notes = this.notes.filter(note => note.id !== id);
            
            // Удаляем связанные связи
            this.connections = this.connections.filter(conn => 
                conn.from !== id && conn.to !== id
            );
            
            this.loadNotes();
            this.saveToLocalStorage();
            this.showNotification('Запись удалена', 'success');
        }
    }
    
    // Шаблоны
    openTemplateModal() {
        document.getElementById('templateModal').style.display = 'flex';
    }
    
    useTemplate(template) {
        const templates = {
            rpg: {
                title: 'Новая RPG игра',
                content: '## Концепция\n\n### Сеттинг:\n\n### Главный герой:\n\n### Основной сюжет:\n\n### Система персонажей:\n- Уровни и прокачка\n- Навыки и способности\n- Экипировка\n- Диалоги и репутация\n\n### Мир игры:\n- Локации\n- Квесты\n- NPC\n- Фракции\n\n### Боевая система:\n\n### Экономика:',
                genre: 'rpg',
                tags: ['RPG', 'Сюжет', 'Персонажи', 'Квесты']
            },
            shooter: {
                title: 'Новый шутер',
                content: '## Концепция\n\n### Сеттинг:\n\n### Тип игры (FPS/TPS):\n\n### Оружие и система стрельбы:\n\n### Враги и ИИ:\n\n### Уровни и локации:\n\n### Мультиплеер:\n- Режимы игры\n- Прогрессия\n- Баланс\n\n### Кооператив:',
                genre: 'shooter',
                tags: ['Шутер', 'Экшен', 'Мультиплеер', 'Оружие']
            },
            strategy: {
                title: 'Новая стратегия',
                content: '## Концепция\n\n### Жанр (RTS/TBS/4X):\n\n### Фракции/расы:\n\n### Ресурсы и экономика:\n\n### Боевые юниты:\n\n### Технологии и развитие:\n\n### Карта и территория:\n\n### Дипломатия и альянсы:',
                genre: 'strategy',
                tags: ['Стратегия', 'Тактика', 'Экономика', 'Юниты']
            },
            platformer: {
                title: 'Новый платформер',
                content: '## Концепция\n\n### Стиль игры:\n\n### Механика передвижения:\n\n### Враги и препятствия:\n\n### Система жизни и смерти:\n\n### Сбор предметов:\n\n### Уровни и дизайн:\n\n### Боссы:',
                genre: 'platformer',
                tags: ['Платформер', 'Аркада', 'Уровни', 'Персонаж']
            }
        };
        
        const selectedTemplate = templates[template];
        if (selectedTemplate) {
            document.getElementById('templateModal').style.display = 'none';
            this.openModal('idea');
            
            setTimeout(() => {
                document.getElementById('noteTitle').value = selectedTemplate.title;
                document.getElementById('noteContent').value = selectedTemplate.content;
                document.getElementById('noteGenre').value = selectedTemplate.genre;
                
                document.getElementById('tagsContainer').innerHTML = '';
                selectedTemplate.tags.forEach(tag => this.addTagToInput(tag));
            }, 100);
        }
    }
    
    // Календарь
    generateCalendar() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        document.getElementById('currentMonth').textContent = 
            now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let calendarHTML = '';
        
        // Дни недели
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekdays.forEach(day => {
            calendarHTML += `<div class="calendar-day weekday">${day}</div>`;
        });
        
        // Пустые ячейки перед первым днем
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day"></div>';
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const notesOnDay = this.getNotesForDate(date);
            
            let className = 'calendar-day';
            if (date.toDateString() === new Date().toDateString()) {
                className += ' today';
            }
            if (notesOnDay.length > 0) {
                className += ' has-notes';
            }
            
            calendarHTML += `
                <div class="${className}" data-date="${dateStr}" 
                     onclick="notebook.selectDate('${dateStr}')" 
                     title="${notesOnDay.length} заметок">
                    ${day}
                </div>
            `;
        }
        
        document.getElementById('calendarGrid').innerHTML = calendarHTML;
        this.updateCalendarNotes();
    }
    
    changeMonth(delta) {
        const current = this.selectedDate;
        current.setMonth(current.getMonth() + delta);
        this.generateCalendar();
    }
    
    selectDate(dateStr) {
        this.selectedDate = new Date(dateStr);
        this.currentFilters.date = dateStr;
        this.applyFilters();
        this.updateCalendarNotes();
    }
    
    getNotesForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.notes.filter(note => {
            const noteDate = new Date(note.date).toISOString().split('T')[0];
            return noteDate === dateStr;
        });
    }
    
    updateCalendarNotes() {
        const notes = this.getNotesForDate(this.selectedDate);
        document.getElementById('notesCount').textContent = notes.length;
    }
    
    // Популярные теги
    loadPopularTags() {
        const tagCounts = {};
        this.notes.forEach(note => {
            note.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        
        const popularTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const container = document.getElementById('popularTags');
        container.innerHTML = '';
        
        popularTags.forEach(([tag, count]) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'popular-tag';
            tagElement.textContent = `${tag} (${count})`;
            tagElement.addEventListener('click', () => {
                this.currentFilters.tags = [tag];
                this.updateActiveTags();
                this.applyFilters();
            });
            container.appendChild(tagElement);
        });
    }
    
    // Таймлайн
    loadTimeline() {
        const container = document.getElementById('timelineContainer');
        container.innerHTML = '';
        
        if (this.milestones.length === 0) {
            container.innerHTML = '<div class="empty-state">Добавьте вехи для создания таймлайна</div>';
            return;
        }
        
        // Сортируем вехи по дате
        const sortedMilestones = [...this.milestones].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        sortedMilestones.forEach(milestone => {
            const milestoneElement = document.createElement('div');
            milestoneElement.className = 'timeline-item';
            
            const date = new Date(milestone.date);
            const formattedDate = date.toLocaleDateString('ru-RU');
            
            milestoneElement.innerHTML = `
                <h3>${this.escapeHtml(milestone.title)}</h3>
                <div class="milestone-date">${formattedDate}</div>
                <p>${this.escapeHtml(milestone.description)}</p>
                ${milestone.notes && milestone.notes.length ? `
                    <div class="milestone-notes">
                        <strong>Связанные заметки:</strong>
                        <ul>
                            ${milestone.notes.map(noteId => {
                                const note = this.notes.find(n => n.id === noteId);
                                return note ? `<li>${note.title}</li>` : '';
                            }).join('')}
                        </ul>
                    </div>
                ` : ''}
                <button class="btn-small delete-milestone" onclick="notebook.deleteMilestone(${milestone.id})">
                    Удалить
                </button>
            `;
            
            container.appendChild(milestoneElement);
        });
    }
    
    addMilestone() {
        const title = prompt('Название вехи:');
        if (!title) return;
        
        const dateStr = prompt('Дата (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
        if (!dateStr) return;
        
        const description = prompt('Описание:');
        
        const milestone = {
            id: Date.now(),
            title,
            date: dateStr,
            description: description || '',
            notes: [],
            createdAt: new Date().toISOString()
        };
        
        this.milestones.push(milestone);
        this.saveToLocalStorage();
        this.loadTimeline();
        this.showNotification('Веха добавлена', 'success');
    }
    
    deleteMilestone(id) {
        if (confirm('Удалить эту веху?')) {
            this.milestones = this.milestones.filter(m => m.id !== id);
            this.saveToLocalStorage();
            this.loadTimeline();
        }
    }
    
    generateRoadmap() {
        // Генерируем roadmap на основе приоритетов и оценок времени
        const highPriorityNotes = this.notes
            .filter(n => n.priority === 'high' && n.status !== 'completed')
            .sort((a, b) => (a.rating || 3) - (b.rating || 3));
        
        let roadmap = '# Roadmap разработки\n\n';
        roadmap += '## Высокий приоритет\n\n';
        
        highPriorityNotes.forEach(note => {
            roadmap += `### ${note.title}\n`;
            roadmap += `- Оценка: ${note.timeEstimate || 1} ${this.getTimeUnitName(note.timeUnit)}\n`;
            roadmap += `- Сложность: ${note.complexity || 5}/10\n`;
            roadmap += `- Статус: ${note.status || 'todo'}\n\n`;
        });
        
        // Открываем roadmap в новом окне
        const win = window.open('', '_blank');
        win.document.write(`<pre>${roadmap}</pre>`);
        win.document.close();
    }
    
    // Граф связей
    drawConnectionsGraph() {
        const canvas = document.getElementById('connectionsGraph');
        const ctx = canvas.getContext('2d');
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.connections.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Нет связей между записями', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Рисуем граф связей
        const nodes = {};
        this.notes.forEach(note => {
            nodes[note.id] = {
                x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
                y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
                note: note
            };
        });
        
        // Рисуем связи
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
        ctx.lineWidth = 2;
        
        this.connections.forEach(conn => {
            const fromNode = nodes[conn.from];
            const toNode = nodes[conn.to];
            
            if (fromNode && toNode) {
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
            }
        });
        
        // Рисуем узлы
        Object.values(nodes).forEach(node => {
            ctx.fillStyle = node.note.type === 'idea' ? '#ff7e5f' : '#36d1dc';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                node.note.title.substring(0, 10) + (node.note.title.length > 10 ? '...' : ''),
                node.x,
                node.y + 5
            );
        });
        
        // Обновляем список связей
        this.updateConnectionsList();
    }
    
    updateConnectionsList() {
        const container = document.getElementById('connectionsList');
        container.innerHTML = '';
        
        this.connections.forEach(conn => {
            const fromNote = this.notes.find(n => n.id === conn.from);
            const toNote = this.notes.find(n => n.id === conn.to);
            
            if (fromNote && toNote) {
                const connElement = document.createElement('div');
                connElement.className = 'connection-item';
                connElement.innerHTML = `
                    <strong>${fromNote.title}</strong>
                    <i class="fas fa-arrow-right"></i>
                    <strong>${toNote.title}</strong>
                    <span class="connection-type">${conn.type}</span>
                `;
                container.appendChild(connElement);
            }
        });
    }
    
    // GitHub интеграция
    openGithubModal() {
        document.getElementById('githubModal').style.display = 'flex';
        
        // Заполняем сохраненные настройки
        document.getElementById('githubToken').value = this.settings.githubToken || '';
        document.getElementById('githubRepo').value = this.settings.githubRepo || '';
    }
    
    async testGithubConnection() {
        const token = document.getElementById('githubToken').value;
        const repo = document.getElementById('githubRepo').value;
        
        if (!token || !repo) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        try {
            this.showNotification('Проверка подключения...', 'info');
            
            // Сохраняем настройки
            this.settings.githubToken = token;
            this.settings.githubRepo = repo;
            this.saveSettings();
            
            this.showNotification('Подключение успешно!', 'success');
        } catch (error) {
            this.showNotification('Ошибка подключения: ' + error.message, 'error');
        }
    }
    
    async syncToGithub() {
        const token = document.getElementById('githubToken').value;
        const repo = document.getElementById('githubRepo').value;
        const file = document.getElementById('githubFile').value;
        
        if (!token || !repo) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        try {
            this.showNotification('Синхронизация...', 'info');
            
            const data = {
                notes: this.notes,
                milestones: this.milestones,
                connections: this.connections,
                exportedAt: new Date().toISOString()
            };
            
            // В реальном приложении здесь был бы fetch запрос к GitHub API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showNotification('Данные синхронизированы с GitHub!', 'success');
        } catch (error) {
            this.showNotification('Ошибка синхронизации: ' + error.message, 'error');
        }
    }
    
    async loadFromGithub() {
        const token = document.getElementById('githubToken').value;
        const repo = document.getElementById('githubRepo').value;
        const file = document.getElementById('githubFile').value;
        
        if (!token || !repo) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        try {
            this.showNotification('Загрузка данных...', 'info');
            
            // В реальном приложении здесь был бы fetch запрос к GitHub API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Имитация загрузки
            const mockData = {
                notes: [],
                milestones: [],
                connections: []
            };
            
            this.notes = mockData.notes;
            this.milestones = mockData.milestones;
            this.connections = mockData.connections;
            
            this.loadNotes();
            this.saveToLocalStorage();
            
            this.showNotification('Данные загружены из GitHub!', 'success');
        } catch (error) {
            this.showNotification('Ошибка загрузки: ' + error.message, 'error');
        }
    }
    
    // Экспорт
    openExportModal() {
        document.getElementById('exportModal').style.display = 'flex';
        document.getElementById('exportPreviewArea').style.display = 'none';
    }
    
    showExportPreview() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const whatToExport = Array.from(document.querySelectorAll('input[name="exportWhat"]:checked'))
            .map(input => input.value);
        
        let previewContent = '';
        
        if (format === 'json') {
            const data = {
                notes: whatToExport.includes('ideas') || whatToExport.includes('mechanics') ? 
                    this.notes.filter(n => 
                        (whatToExport.includes('ideas') && n.type === 'idea') ||
                        (whatToExport.includes('mechanics') && n.type === 'mechanic')
                    ) : [],
                milestones: whatToExport.includes('timeline') ? this.milestones : [],
                connections: whatToExport.includes('connections') ? this.connections : [],
                exportedAt: new Date().toISOString()
            };
            
            previewContent = JSON.stringify(data, null, 2);
        } else if (format === 'markdown') {
            previewContent = '# GameDev Notes Export\n\n';
            
            if (whatToExport.includes('ideas')) {
                previewContent += '## Идеи игр\n\n';
                this.notes.filter(n => n.type === 'idea').forEach(note => {
                    previewContent += `### ${note.title}\n`;
                    previewContent += `**Жанр:** ${note.genre || 'Не указан'}\n`;
                    previewContent += `**Приоритет:** ${note.priority}\n`;
                    previewContent += `**Рейтинг:** ${note.rating || 'Не указан'}/5\n\n`;
                    previewContent += `${note.content}\n\n`;
                    previewContent += '---\n\n';
                });
            }
        }
        
        document.getElementById('previewContent').textContent = previewContent;
        document.getElementById('exportPreviewArea').style.display = 'block';
    }
    
    executeExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        
        switch(format) {
            case 'json':
                this.exportJSON();
                break;
            case 'markdown':
                this.exportMarkdown();
                break;
            case 'pdf':
                this.exportPDF();
                break;
            case 'csv':
                this.exportCSV();
                break;
        }
    }
    
    exportJSON() {
        const data = {
            notes: this.notes,
            milestones: this.milestones,
            connections: this.connections,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        this.downloadFile(dataStr, 'gamedev-notes.json', 'application/json');
    }
    
    exportMarkdown() {
        let markdown = '# GameDev Notebook - Экспорт\n\n';
        markdown += `*Экспортировано: ${new Date().toLocaleDateString('ru-RU')}*\n\n`;
        
        // Идеи
        markdown += '## 💡 Идеи игр\n\n';
        this.notes.filter(n => n.type === 'idea').forEach(note => {
            markdown += `### ${note.title}\n`;
            markdown += `**Жанр:** ${note.genre || 'Не указан'}  \n`;
            markdown += `**Приоритет:** ${note.priority}  \n`;
            markdown += `**Статус:** ${note.status || 'Не указан'}  \n`;
            markdown += `**Рейтинг:** ${note.rating ? '★'.repeat(note.rating) : 'Не указан'}  \n`;
            markdown += `**Теги:** ${note.tags.join(', ') || 'Нет'}  \n\n`;
            markdown += `${note.content}\n\n`;
            markdown += '---\n\n';
        });
        
        // Механики
        markdown += '## ⚙️ Механики\n\n';
        this.notes.filter(n => n.type === 'mechanic').forEach(note => {
            markdown += `### ${note.title}\n`;
            markdown += `**Категория:** ${note.category || 'Не указана'}  \n`;
            markdown += `**Сложность:** ${note.complexity || 'Не указана'}/10  \n`;
            markdown += `**Время реализации:** ${note.timeEstimate || 'Не указано'} ${this.getTimeUnitName(note.timeUnit)}  \n\n`;
            markdown += `${note.content}\n\n`;
            markdown += '---\n\n';
        });
        
        this.downloadFile(markdown, 'gamedev-notes.md', 'text/markdown');
    }
    
    exportPDF() {
        // Используем jsPDF для генерации PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('GameDev Notebook', 20, 20);
        doc.setFontSize(12);
        doc.text(`Экспортировано: ${new Date().toLocaleDateString('ru-RU')}`, 20, 30);
        
        let y = 40;
        
        // Добавляем заметки
        this.notes.forEach((note, index) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(16);
            doc.text(`${note.type === 'idea' ? '💡' : '⚙️'} ${note.title}`, 20, y);
            y += 10;
            
            doc.setFontSize(10);
            doc.text(`Жанр: ${note.genre || 'Не указан'} | Приоритет: ${note.priority} | Рейтинг: ${note.rating || 'Не указан'}/5`, 20, y);
            y += 10;
            
            const lines = doc.splitTextToSize(note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''), 170);
            doc.text(lines, 20, y);
            y += lines.length * 7 + 10;
        });
        
        doc.save('gamedev-notes.pdf');
        this.showNotification('PDF экспортирован!', 'success');
    }
    
    exportCSV() {
        let csv = 'Тип,Название,Жанр,Приоритет,Статус,Рейтинг,Теги,Дата создания\n';
        
        this.notes.forEach(note => {
            csv += `"${note.type === 'idea' ? 'Идея' : 'Механика'}","${note.title}","${note.genre || ''}","${note.priority}","${note.status || ''}","${note.rating || ''}","${note.tags.join(', ')}","${new Date(note.date).toLocaleDateString('ru-RU')}"\n`;
        });
        
        this.downloadFile(csv, 'gamedev-notes.csv', 'text/csv');
    }
    
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification(`Файл ${filename} скачан!`, 'success');
    }
    
    importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.md,.csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.notes && Array.isArray(data.notes)) {
                        this.notes = data.notes;
                        this.milestones = data.milestones || [];
                        this.connections = data.connections || [];
                        
                        this.loadNotes();
                        this.saveToLocalStorage();
                        this.showNotification('Данные успешно импортированы!', 'success');
                    } else {
                        this.showNotification('Неверный формат файла', 'error');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при чтении файла', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Вспомогательные методы
    saveToLocalStorage() {
        localStorage.setItem('gamedevNotes', JSON.stringify(this.notes));
        localStorage.setItem('gamedevMilestones', JSON.stringify(this.milestones));
        localStorage.setItem('gamedevConnections', JSON.stringify(this.connections));
        
        // Показываем уведомление только если это не автосохранение
        if (!this.settings.autoSave || this.lastManualSave !== Date.now()) {
            this.showNotification('Данные сохранены', 'success');
            this.lastManualSave = Date.now();
        }
    }
    
    saveSettings() {
        localStorage.setItem('gamedevSettings', JSON.stringify(this.settings));
    }
    
    closeModal() {
        document.getElementById('modal').style.display = 'none';
        this.currentNote = null;
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getTimeUnitName(unit) {
        const units = {
            hours: 'часов',
            days: 'дней',
            weeks: 'недель',
            months: 'месяцев'
        };
        return units[unit] || 'часов';
    }
}

// Инициализация приложения
const notebook = new GameDevNotebookPro();