document.addEventListener('DOMContentLoaded', () => {
            // --- CONSTANTS & STATE ---
            const LIMITS = { PILATES: 5, CLASSPASS: 50 };
            let currentDate = new Date();
            let logs = JSON.parse(localStorage.getItem('fitnessTrackerLogs')) || {};
            let selectedDateKey = null;
            let selectedActivityType = 'pilates';

            // --- DOM ELEMENTS ---
            const statsContainer = {
                pilatesLeft: document.getElementById('pilates-left'),
                creditsLeft: document.getElementById('credits-left'),
            };
            const calendar = {
                header: document.getElementById('month-year-header'),
                daysGrid: document.getElementById('calendar-days'),
                prevBtn: document.getElementById('prev-month-btn'),
                nextBtn: document.getElementById('next-month-btn'),
                resetBtn: document.getElementById('reset-month-btn'),
            };
            const modal = {
                overlay: document.getElementById('activity-modal'),
                title: document.getElementById('modal-title'),
                closeBtn: document.getElementById('modal-close-btn'),
                pilatesBtn: document.getElementById('pilates-btn'),
                classpassBtn: document.getElementById('classpass-btn'),
                creditsInputGroup: document.getElementById('credits-input-group'),
                creditCostInput: document.getElementById('credit-cost'),
                deleteBtn: document.getElementById('delete-btn'),
                saveBtn: document.getElementById('save-btn'),
            };

            // --- DATE HELPERS ---
            const formatDateKey = (date) => date.toISOString().split('T')[0];

            // --- CORE LOGIC ---
            const saveLogs = () => {
                localStorage.setItem('fitnessTrackerLogs', JSON.stringify(logs));
            };

            const calculateStats = () => {
                const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                let pilatesUsed = 0;
                let creditsUsed = 0;

                for (const key in logs) {
                    if (key.startsWith(monthPrefix)) {
                        const log = logs[key];
                        if (log.type === 'pilates') pilatesUsed++;
                        if (log.type === 'classpass') creditsUsed += log.cost;
                    }
                }

                statsContainer.pilatesLeft.textContent = LIMITS.PILATES - pilatesUsed;
                statsContainer.creditsLeft.textContent = LIMITS.CLASSPASS - creditsUsed;
            };

            const renderCalendar = () => {
                calendar.daysGrid.innerHTML = '';
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();

                calendar.header.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                // Empty cells for alignment
                for (let i = 0; i < firstDayOfMonth; i++) {
                    const emptyCell = document.createElement('div');
                    emptyCell.className = 'day-cell empty';
                    calendar.daysGrid.appendChild(emptyCell);
                }

                // Day cells
                for (let day = 1; day <= daysInMonth; day++) {
                    const cell = document.createElement('div');
                    cell.className = 'day-cell';
                    cell.dataset.day = day;
                    
                    const dayNumber = document.createElement('div');
                    dayNumber.className = 'day-number';
                    dayNumber.textContent = day;
                    cell.appendChild(dayNumber);

                    const dateKey = formatDateKey(new Date(year, month, day));
                    if (logs[dateKey]) {
                        const log = logs[dateKey];
                        const logEntry = document.createElement('div');
                        logEntry.className = 'log-entry';
                        if (log.type === 'pilates') {
                            logEntry.classList.add('log-pilates');
                            logEntry.textContent = 'Pilates';
                        } else {
                            logEntry.classList.add('log-classpass');
                            logEntry.textContent = `${log.cost} Credits`;
                        }
                        cell.appendChild(logEntry);
                    }
                    calendar.daysGrid.appendChild(cell);
                }
                calculateStats();
            };
            
            // --- MODAL HANDLING ---
            const openModal = (dateKey) => {
                selectedDateKey = dateKey;
                modal.title.textContent = `Log for ${dateKey}`;

                const log = logs[dateKey];
                if (log) {
                    selectedActivityType = log.type;
                    modal.creditCostInput.value = log.cost || '';
                    modal.deleteBtn.style.display = 'block';
                } else {
                    selectedActivityType = 'pilates';
                    modal.creditCostInput.value = '';
                    modal.deleteBtn.style.display = 'none';
                }
                
                updateModalUI();
                modal.overlay.classList.add('open');
            };

            const closeModal = () => {
                modal.overlay.classList.remove('open');
            };

            const updateModalUI = () => {
                if (selectedActivityType === 'pilates') {
                    modal.pilatesBtn.classList.add('selected');
                    modal.classpassBtn.classList.remove('selected');
                    modal.creditsInputGroup.style.display = 'none';
                } else {
                    modal.classpassBtn.classList.add('selected');
                    modal.pilatesBtn.classList.remove('selected');
                    modal.creditsInputGroup.style.display = 'block';
                }
            };

            // --- EVENT LISTENERS ---
            calendar.prevBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            });

            calendar.nextBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            });

            calendar.resetBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to erase all data for ${currentDate.toLocaleString('default', { month: 'long' })}? This cannot be undone.`)) {
                    const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                    for (const key in logs) {
                        if (key.startsWith(monthPrefix)) {
                            delete logs[key];
                        }
                    }
                    saveLogs();
                    renderCalendar();
                }
            });

            calendar.daysGrid.addEventListener('click', (e) => {
                const cell = e.target.closest('.day-cell:not(.empty)');
                if (cell) {
                    const day = cell.dataset.day;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const offset = date.getTimezoneOffset();
                    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                    openModal(formatDateKey(adjustedDate));
                }
            });

            modal.closeBtn.addEventListener('click', closeModal);
            modal.overlay.addEventListener('click', (e) => {
                if (e.target === modal.overlay) closeModal();
            });

            modal.pilatesBtn.addEventListener('click', () => {
                selectedActivityType = 'pilates';
                updateModalUI();
            });

            modal.classpassBtn.addEventListener('click', () => {
                selectedActivityType = 'classpass';
                updateModalUI();
            });
            
            modal.saveBtn.addEventListener('click', () => {
                const cost = selectedActivityType === 'pilates' ? 1 : parseInt(modal.creditCostInput.value) || 0;
                logs[selectedDateKey] = {
                    type: selectedActivityType,
                    cost: cost,
                };
                saveLogs();
                renderCalendar();
                closeModal();
            });

            modal.deleteBtn.addEventListener('click', () => {
                if (logs[selectedDateKey]) {
                    delete logs[selectedDateKey];
                    saveLogs();
                    renderCalendar();
                    closeModal();
                }
            });

            // --- INITIALIZATION ---
            renderCalendar();
        });