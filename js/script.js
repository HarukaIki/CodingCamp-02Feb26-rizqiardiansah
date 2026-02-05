
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const dateInput = document.getElementById('date-input');
    const addBtn = document.getElementById('add-btn');
    const toastContainer = document.getElementById('toast-container');
    const todoListBody = document.getElementById('todo-list-body');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    const deleteModal = document.getElementById('delete-modal');
    const deleteModalText = document.getElementById('delete-modal-text');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const progressPercentEl = document.getElementById('progress-percent');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let todoToDeleteId = null;
    let deleteActionType = null;
    let editMode = false;
    let taskIdToEdit = null;

    saveAndRender(); 

    addBtn.addEventListener('click', addTodo);
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    deleteAllBtn.addEventListener('click', () => {
        if (todos.length === 0) return; 
        deleteActionType = 'all';
        deleteModalText.textContent = "Apakah Kamu yakin ingin menghapus SEMUA kegiatan?";
        deleteModal.classList.add('show');
    });

    cancelDeleteBtn.addEventListener('click', closeModal);

    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteActionType === 'all') {
            todos = [];
            saveAndRender();
            showToast('Semua kegiatan berhasil dihapus!', 'danger');
        } else if (deleteActionType === 'single' && todoToDeleteId) {
            todos = todos.filter(todo => todo.id !== todoToDeleteId);
            saveAndRender();
            showToast('Kegiatan berhasil dihapus!', 'danger');
        }
        closeModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeModal();
        }
    });

    function closeModal() {
        deleteModal.classList.remove('show');
        todoToDeleteId = null;
        deleteActionType = null;
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {

            filterBtns.forEach(b => b.classList.remove('active'));
 
            btn.classList.add('active');

            currentFilter = btn.getAttribute('data-filter');
            renderTodos();
        });
    });

    function addTodo() {
        const taskText = taskInput.value.trim();
        const dateValue = dateInput.value;

        if (taskText === '') {
            showToast('Mohon isi nama kegiatan terlebih dahulu.', 'danger');
            return;
        }

        if (editMode) {
            todos = todos.map(todo => {
                if (todo.id === taskIdToEdit) {
                    return { ...todo, text: taskText, date: dateValue || 'Tanpa Tanggal' };
                }
                return todo;
            });
            
            // Reset Edit Mode
            editMode = false;
            taskIdToEdit = null;
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            showToast('Kegiatan berhasil diperbarui!', 'info');
        } else {
            const newTodo = {
                id: Date.now(),
                text: taskText,
                date: dateValue || 'Tanpa Tanggal',
                completed: false
            };
            todos.push(newTodo);
            showToast('Kegiatan berhasil ditambahkan!', 'success');
        }

        saveAndRender();

        taskInput.value = '';
        dateInput.value = '';
    }

    function deleteTodo(id) {
        todoToDeleteId = id;
        deleteActionType = 'single';
        deleteModalText.textContent = "Apakah Kamu yakin ingin menghapus kegiatan ini?";
        deleteModal.classList.add('show');
    }

    function toggleStatus(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveAndRender();
    }

    function startEdit(id) {
        const todoToEdit = todos.find(todo => todo.id === id);
        if (!todoToEdit) return;

        taskInput.value = todoToEdit.text;
        
        // Handle date input
        if (todoToEdit.date && todoToEdit.date !== 'Tanpa Tanggal') {
             dateInput.value = todoToEdit.date;
        } else {
            dateInput.value = '';
        }

        editMode = true;
        taskIdToEdit = id;
        addBtn.innerHTML = '<i class="fas fa-save"></i>';
        
        taskInput.focus();
    }

    function saveAndRender() {
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
        updateStats();
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        progressPercentEl.textContent = `${percent}%`;
    }

    function renderTodos() {

        todoListBody.innerHTML = '';

        let filteredTodos = todos;
        if (currentFilter === 'pending') {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(todo => todo.completed);
        }

        if (filteredTodos.length === 0) {
            let emptyMsgText = "Belum ada Kegiatan. Yuk tambah Kegiatan!";
            if (currentFilter === 'pending') emptyMsgText = "Tidak ada Kegiatan tertunda.";
            if (currentFilter === 'completed') emptyMsgText = "Belum ada Kegiatan yang selesai.";
            
            if (todos.length === 0) emptyMsgText = "Belum ada Kegiatan. Yuk tambah Kegiatan!";

            todoListBody.innerHTML = `
                <div class="no-task-message">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${emptyMsgText}</p>
                </div>
            `;
            return;
        } 
        
        filteredTodos.forEach(todo => {
            const card = document.createElement('div');
            card.className = `task-card ${todo.completed ? 'completed' : ''}`;
            
            const badgeClass = todo.completed ? 'badge-completed' : 'badge-pending';
            const badgeText = todo.completed ? 'Selesai' : 'Belum Selesai';
            const completeIcon = todo.completed ? 'fa-undo' : 'fa-check';
            const dateDisplay = todo.date === 'Tanpa Tanggal' ? 'Tanpa Tanggal' : new Date(todo.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            card.innerHTML = `
                <div class="task-content">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                    <h3>${escapeHtml(todo.text)}</h3>
                    <div class="task-meta">
                        <i class="far fa-calendar-alt"></i>
                        <span>${dateDisplay}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-btn edit-btn" onclick="startEdit(${todo.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-btn ${todo.completed ? 'undo-btn' : 'check-btn'}" onclick="toggleStatus(${todo.id})" title="${todo.completed ? 'TKamui Belum Selesai' : 'TKamui Selesai'}">
                        <i class="fas ${completeIcon}"></i>
                    </button>
                    <button class="card-btn trash-btn" onclick="deleteTodo(${todo.id})" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            todoListBody.appendChild(card);
        });
    }

    window.deleteTodo = deleteTodo;
    window.toggleStatus = toggleStatus;
    window.startEdit = startEdit;
    
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'danger') icon = 'fa-exclamation-circle';
        if (type === 'info') icon = 'fa-info-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${msg}</span>
        `;
        
        toastContainer.appendChild(toast);

        // Remove after 3 seconds with fade out
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
